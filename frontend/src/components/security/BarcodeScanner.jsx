import React, { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import axios from 'axios';
import { ScanLine, CheckCircle, AlertCircle } from 'lucide-react';
import '../../styles/security/barcode-scanner.css';

export default function BarcodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [detectedStudent, setDetectedStudent] = useState(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'summary' | 'test'
  const [queue, setQueue] = useState(() => loadQueueSafe());
  const [error, setError] = useState(null);
  const [testInput, setTestInput] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lastScanTime = useRef(0);
  const detectionCount = useRef({});
  
  // Lightweight mappings and helpers (synchronous, zero latency)
  const DEPT_MAP = {
    '24': 'AE',
    '72': 'AI&DS',
    '01': 'CE',
    '66': 'CS-AIML',
    '62': 'CS-CYS',
    '67': 'CS-DS',
    '69': 'CS-IOT',
    '32': 'CSBS',
    '05': 'CSE',
    '04': 'ECE',
    '03': 'EEE',
    '10': 'EIE',
    '12': 'IT',
    '02': 'ME',
  };
  
  const INSTITUTE_MAP = {
    '071A': { name: 'VNRVJIET', entry: 'Direct Entry', durationYears: 4 },
    '075A': { name: 'VNRVJIET', entry: 'Lateral Entry', durationYears: 3 },
  };

  // Offline queue persistence (localStorage)
  const SCAN_STORE_KEY = 'scanQueue.v1';
  
  function loadQueueSafe() {
    try {
      const raw = localStorage.getItem(SCAN_STORE_KEY);
      if (!raw) {
        console.log('📦 [LOAD QUEUE] Queue empty in localStorage');
        return {};
      }
      const parsed = JSON.parse(raw);
      const isValid = typeof parsed === 'object' && parsed;
      if (isValid) {
        console.log('📦 [LOAD QUEUE] Loaded', Object.keys(parsed).length, 'scans from storage');
      }
      return isValid ? parsed : {};
    } catch (e) {
      console.error('❌ [LOAD QUEUE ERROR]', e.message);
      return {};
    }
  }
  
  function persistQueue(next) {
    try {
      localStorage.setItem(SCAN_STORE_KEY, JSON.stringify(next));
      console.log('💾 [PERSIST QUEUE] Saved', Object.keys(next).length, 'scans to localStorage');
    } catch (e) {
      console.error('❌ [PERSIST QUEUE ERROR]', e.message);
    }
  }
  
  function formatTime(ts) {
    const d = new Date(ts);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; h = h || 12;
    return `${h}:${m} ${ampm}`;
  }
  
  function commitScan(student) {
    const now = Date.now();
    console.log('📝 [COMMIT SCAN]', {
      rollNumber: student.rollNumber,
      timestamp: new Date(now).toLocaleTimeString(),
      isNewStudent: !queue[student.rollNumber]
    });
    
    setQueue(prev => {
      const next = { ...prev };
      const key = student.rollNumber;
      const prevEntry = next[key];
      next[key] = {
        rollNumber: student.rollNumber,
        year: student.year,
        deptCode: student.deptCode,
        deptName: student.deptName,
        entry: student.entry,
        lastSeen: now,
      };
      
      if (prevEntry) {
        console.log('⚠️ [DUPLICATE SCAN] Student already in queue', {
          rollNumber: key,
          firstScannedAt: new Date(prevEntry.lastSeen).toLocaleTimeString(),
          rescannedAt: new Date(now).toLocaleTimeString()
        });
      }
      
      persistQueue(next);
      console.log('✅ [QUEUE UPDATED]', {
        totalScans: Object.keys(next).length,
        latestRoll: key
      });
      return next;
    });
  }
  
  function getAggregated(queueObj) {
    const groups = {};
    Object.values(queueObj).forEach((rec) => {
      const y = rec.year;
      const d = rec.deptCode;
      if (!groups[y]) groups[y] = {};
      if (!groups[y][d]) {
        const mappedName = DEPT_MAP[d] || rec.deptName || `Dept ${d}`;
        groups[y][d] = { deptName: mappedName, students: [] };
      }
      groups[y][d].students.push({ rollNumber: rec.rollNumber, lastSeen: rec.lastSeen });
    });
    return groups;
  }

  const validateRollNumber = (code) => {
    const rollPattern = /^2[0-9]07[15]A[0-9]{2}[A-Z0-9]{2}$/;
    return rollPattern.test(code);
  };

  const parseStudentData = (rollNumber, opts = {}) => {
    const admissionYY = parseInt(rollNumber.substring(0, 2), 10);
    const year = '20' + rollNumber.substring(0, 2);
    const institutionCode = rollNumber.substring(2, 6);
    const deptCode = rollNumber.substring(6, 8);
    const studentRoll = rollNumber.substring(8, 10);

    const instituteMeta = INSTITUTE_MAP[institutionCode] || { name: 'VNRVJIET', entry: 'Unknown', durationYears: 4 };
    const deptName = DEPT_MAP[deptCode] || `Dept ${deptCode}`;

    const currentYear = new Date().getFullYear();
    const inferredStartYear = 2000 + admissionYY;
    let yearsSince = Math.max(0, currentYear - inferredStartYear);
    const lateralOffset = instituteMeta.entry === 'Lateral Entry' ? 1 : 0;
    let yearOfStudy = Math.min(4, yearsSince + 1 + lateralOffset);
    if (yearOfStudy < 1) yearOfStudy = 1;

    const ord = (n) => {
      const s = ["th","st","nd","rd"], v = n % 100;
      return n + (s[(v-20)%10] || s[v] || s[0]);
    };

    const confidence = opts.confidence ?? undefined;

    return {
      rollNumber,
      year,
      institute: instituteMeta.name,
      entry: instituteMeta.entry,
      deptCode,
      deptName,
      studentRoll,
      yearOfStudyLabel: ord(yearOfStudy),
      confidence,
    };
  };

  const startScanning = async () => {
    try {
      console.log('🚀 [START SCANNING] Initializing barcode scanner...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ [CAMERA NOT SUPPORTED] getUserMedia not available');
        setError('Camera not supported in your browser');
        return;
      }

      console.log('✅ [MEDIA DEVICES] getUserMedia is available');
      setScanning(true);
      setShowSuccess(false);
      setDetectedStudent(null);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 150));

      if (!videoRef.current) {
        console.error('❌ [VIDEO REF ERROR] Video element not ready');
        setScanning(false);
        setError('Video element not ready. Please try again.');
        return;
      }

      console.log('📹 [VIDEO ELEMENT] Video ref ready, initializing Quagga...');

      // Initialize Quagga first
      Quagga.init(
        {
          inputStream: {
            type: 'LiveStream',
            target: videoRef.current,
            constraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            area: {
              top: '10%',
              right: '10%',
              left: '10%',
              bottom: '10%'
            }
          },
          decoder: {
            readers: ['code_128_reader', 'ean_reader', 'code_39_reader'],
            debug: {
              drawBoundingBox: false,
              showFrequency: false,
              drawScanline: false,
              showPattern: false
            }
          },
          locate: true,
          frequency: 10,
          multiple: false
        },
        (err) => {
          if (err) {
            console.error('❌ [QUAGGA INIT ERROR]', err);
            setError('Failed to initialize scanner: ' + err.message);
            stopScanning();
            return;
          }

          console.log('✅ [QUAGGA INITIALIZED] Starting camera stream...');
          
          try {
            Quagga.start();
            console.log('✅ [QUAGGA STARTED] Camera is streaming');
            
            // Attach detection handler
            Quagga.onDetected(onBarcodeDetected);
            console.log('🔍 [BARCODE DETECTION] Listener attached - ready to scan');
            
            // Store stream reference if available
            const tracks = videoRef.current?.srcObject?.getTracks?.();
            if (tracks?.length) {
              streamRef.current = videoRef.current.srcObject;
              console.log('📹 [STREAM ATTACHED]', {
                videoTracks: tracks.filter(t => t.kind === 'video').length,
                audioTracks: tracks.filter(t => t.kind === 'audio').length
              });
            }
          } catch (startErr) {
            console.error('❌ [QUAGGA START ERROR]', startErr);
            setError('Failed to start camera: ' + startErr.message);
            stopScanning();
          }
        }
      );
    } catch (err) {
      console.error('❌ [CAMERA ACCESS ERROR]', {
        name: err.name,
        message: err.message,
        code: err.code
      });
      setError('Failed to initialize scanner: ' + err.message);
      setScanning(false);
    }
  };

  const stopScanning = () => {
    console.log('🛑 [STOP SCANNING] Shutting down barcode scanner...');
    try {
      Quagga.stop();
      console.log('✅ [QUAGGA STOPPED]');
      Quagga.offDetected(onBarcodeDetected);
      console.log('✅ [DETECTION LISTENER REMOVED]');
    } catch (e) {
      console.warn('⚠️ [QUAGGA CLEANUP WARNING]', e.message);
    }
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      console.log(`🎬 [STOPPING TRACKS] Stopping ${tracks.length} media tracks...`);
      tracks.forEach((track, index) => {
        console.log(`  Track ${index}: ${track.kind} - stopping...`);
        track.stop();
      });
      streamRef.current = null;
      console.log('✅ [ALL TRACKS STOPPED]');
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log('✅ [VIDEO ELEMENT CLEANED]');
    }
    
    detectionCount.current = {};
    console.log('✅ [DETECTION COUNT RESET]');
    setScanning(false);
  };

  const onBarcodeDetected = (result) => {
    if (!result || !result.codeResult) {
      console.warn('⚠️ [INVALID RESULT] No codeResult in detection');
      return;
    }

    const code = result.codeResult.code;
    if (!code) {
      console.warn('⚠️ [NO CODE] Detection result has no code value');
      return;
    }

    const now = Date.now();
    
    console.log('🔍 [BARCODE DETECTED]', {
      code,
      timestamp: new Date(now).toLocaleTimeString(),
      currentDetectionCount: detectionCount.current[code] || 0,
      timeSinceLastScan: now - lastScanTime.current,
      allDetectionCounts: { ...detectionCount.current }
    });
    
    // Cooldown check
    if (now - lastScanTime.current < 2000) {
      console.warn('⏱️ [COOLDOWN ACTIVE] Ignoring scan - too soon after last scan', {
        lastScanTime: lastScanTime.current,
        timeSince: now - lastScanTime.current,
        requiredCooldown: 2000
      });
      return;
    }
    
    // Track detections
    if (!detectionCount.current[code]) {
      detectionCount.current[code] = 1;
    } else {
      detectionCount.current[code]++;
    }
    
    console.log('📊 [DETECTION COUNT]', {
      code,
      detectionCount: detectionCount.current[code],
      requiredForConfirmation: 2
    });
    
    // Need 2 consistent detections
    if (detectionCount.current[code] < 2) {
      console.info('⏳ [WAITING FOR CONFIRMATION] Need 2 detections, got', detectionCount.current[code]);
      return;
    }
    
    // Validate roll number
    if (!validateRollNumber(code)) {
      console.error('❌ [INVALID ROLL NUMBER FORMAT]', {
        code,
        expectedPattern: '/^2[0-9]07[15]A[0-9]{2}[A-Z0-9]{2}$/'
      });
      detectionCount.current[code] = 0; // Reset counter for invalid format
      return;
    }
    
    console.log('✅ [ROLL NUMBER VALID]', code);
    
    // Quality check with better error handling
    let avgError = 0;
    try {
      const errors = result.codeResult.decodedCodes
        .filter(c => c.error !== undefined)
        .map(c => c.error);
      avgError = errors.length > 0 ? errors.reduce((sum, err) => sum + err, 0) / errors.length : 0;
      
      console.log('📈 [BARCODE QUALITY CHECK]', {
        totalDecodedCodes: result.codeResult.decodedCodes?.length || 0,
        errorsCount: errors.length,
        errorValues: errors.slice(0, 5), // Show first 5 errors
        averageError: avgError.toFixed(4),
        qualityThreshold: 0.1,
        passed: avgError <= 0.1
      });
    } catch (e) {
      console.warn('⚠️ [QUALITY CHECK PARSING ERROR]', e.message);
    }
    
    if (avgError > 0.1) {
      console.warn('⚠️ [QUALITY CHECK FAILED] Barcode quality too poor', {
        averageError: avgError,
        threshold: 0.1
      });
      return;
    }

    // Success!
    console.log('🎉 [BARCODE SUCCESSFULLY VERIFIED]', { code, avgError });
    lastScanTime.current = now;
    detectionCount.current = {};
    
    const studentData = parseStudentData(code, { confidence: Number.isFinite(avgError) ? (1 - Math.min(1, Math.max(0, avgError))) : undefined });
    console.log('👤 [PARSED STUDENT DATA]', studentData);
    
    setDetectedStudent(studentData);
    setShowSuccess(true);
    
    // Commit to offline queue
    commitScan(studentData);
    console.log('📝 [SCAN COMMITTED TO QUEUE]', { rollNumber: studentData.rollNumber });
    
    // Stop scanning immediately
    stopScanning();
    console.log('🛑 [SCANNING STOPPED]');
    
    // Check if this is a new student (first time) or repeat
    const isNewStudent = !queue[code];
    console.log('🆕 [STUDENT STATUS]', {
      rollNumber: code,
      isNewStudent,
      totalScansInQueue: Object.keys(queue).length
    });
    
    // Play different sounds using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const nowAudio = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (isNewStudent) {
        console.log('🔊 [AUDIO] Playing NEW STUDENT sound - 800Hz single beep');
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.3, nowAudio);
        gain.gain.exponentialRampToValueAtTime(0.01, nowAudio + 0.3);
        osc.start(nowAudio);
        osc.stop(nowAudio + 0.3);
      } else {
        console.log('🔊 [AUDIO] Playing REPEAT STUDENT sound - 600Hz double beep');
        osc.frequency.value = 600;
        
        gain.gain.setValueAtTime(0.2, nowAudio);
        gain.gain.exponentialRampToValueAtTime(0.01, nowAudio + 0.15);
        osc.start(nowAudio);
        osc.stop(nowAudio + 0.15);
        
        const osc2 = audioCtx.createOscillator();
        osc2.frequency.value = 600;
        osc2.connect(gain);
        gain.gain.setValueAtTime(0.2, nowAudio + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, nowAudio + 0.4);
        osc2.start(nowAudio + 0.25);
        osc2.stop(nowAudio + 0.4);
      }
    } catch (e) {
      console.warn('⚠️ [AUDIO ERROR]', e.message);
    }
    
    // Haptic feedback
    try { 
      if (navigator.vibrate) {
        const vibrationPattern = isNewStudent ? 100 : [50, 100, 50];
        navigator.vibrate(vibrationPattern);
        console.log('📳 [HAPTIC] Vibration triggered:', vibrationPattern);
      }
    } catch (e) {
      console.warn('⚠️ [HAPTIC ERROR]', e.message);
    }
  };

  const handleScanAgain = () => {
    setShowSuccess(false);
    setDetectedStudent(null);
    setActiveTab('scan');
    startScanning();
  };

  const handleTestScan = () => {
    console.log('🧪 [TEST SCAN] Processing test input:', testInput);
    
    if (!testInput.trim()) {
      setError('Please enter a roll number');
      return;
    }

    const code = testInput.trim().toUpperCase();
    
    if (!validateRollNumber(code)) {
      console.error('❌ [TEST] Invalid roll number format:', code);
      setError(`Invalid format. Expected: 2[0-9]07[15]A[0-9]{2}[A-Z0-9]{2}\nYou entered: ${code}`);
      return;
    }

    console.log('✅ [TEST] Valid roll number, processing...');
    const studentData = parseStudentData(code);
    setDetectedStudent(studentData);
    setShowSuccess(true);
    commitScan(studentData);
    setTestInput('');
    console.log('🎉 [TEST SCAN SUCCESS]', studentData);
  };

  const handleSubmitScans = async () => {
    try {
      console.log('📤 [SUBMIT SCANS] Starting scan submission process...');
      
      if (Object.keys(queue).length === 0) {
        console.warn('⚠️ [NO SCANS] Queue is empty');
        setError('No scans to submit');
        return;
      }

      const payload = Object.values(queue).map(scan => ({
        rollNumber: scan.rollNumber,
        year: scan.year,
        deptCode: scan.deptCode,
        deptName: scan.deptName,
        entry: scan.entry,
        scannedAt: scan.lastSeen,
      }));

      console.log('📦 [PAYLOAD PREPARED]', {
        scans: payload.length,
        serverUrl: import.meta.env.VITE_SERVER_URL,
        endpoint: '/barcode-api/record-scans'
      });

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/barcode-api/record-scans`,
        { scans: payload },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('✅ [SERVER RESPONSE]', {
        statusCode: response.status,
        data: response.data
      });

      if (response.data.success) {
        console.log('🎉 [SUBMISSION SUCCESSFUL]', {
          recordedScans: response.data.count,
          sessionId: response.data.sessionId
        });

        setQueue({});
        persistQueue({});
        setScannedCount(0);
        setError(null);
        alert(`✅ Successfully recorded ${response.data.count} scans!`);
      }
    } catch (err) {
      console.error('❌ [SUBMISSION FAILED]', {
        errorName: err.name,
        errorMessage: err.message,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        fullError: err
      });
      setError(err.response?.data?.message || 'Failed to submit scans');
    }
  };

  useEffect(() => {
    console.log('🔄 [COMPONENT MOUNTED] BarcodeScanner initialized');
    console.log('📱 [DEVICE INFO]', {
      userAgent: navigator.userAgent,
      mediaDevicesSupported: !!navigator.mediaDevices,
      vibrateSupported: !!navigator.vibrate,
      audioContextSupported: !!(window.AudioContext || window.webkitAudioContext)
    });
    setIsReady(true);
    
    return () => {
      console.log('🔄 [COMPONENT UNMOUNTED] Cleaning up...');
      if (streamRef.current) {
        console.log('🎬 [CLEANUP] Stopping all media tracks...');
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (scanning) {
        console.log('🔍 [CLEANUP] Stopping Quagga...');
        Quagga.stop();
      }
      console.log('✅ [CLEANUP COMPLETE]');
    };
  }, []);

  // Handle tab switching
  useEffect(() => {
    console.log('📑 [TAB SWITCHED]', { activeTab, scanning, showSuccess });
    
    if (activeTab === 'scan' && !scanning && !showSuccess) {
      console.log('📑 [AUTO-START SCANNING] User switched to scan tab');
      const timer = setTimeout(() => {
        startScanning();
      }, 150);
      return () => clearTimeout(timer);
    } else if (activeTab === 'summary' && scanning) {
      console.log('📑 [AUTO-STOP SCANNING] User switched to summary tab');
      stopScanning();
    }
  }, [activeTab]);

  return (
    <div className="barcode-scanner-container">
      {/* Header */}
      <div className="bs-header">
        <h1>📱 ID Card Check-in</h1>
        <div className="bs-header-right">
          <div className="bs-tabs">
            <button 
              className={`bs-tab-btn ${activeTab === 'scan' ? 'active' : ''}`} 
              onClick={() => setActiveTab('scan')}
            >
              Scan
            </button>
            <button 
              className={`bs-tab-btn ${activeTab === 'summary' ? 'active' : ''}`} 
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button 
              className={`bs-tab-btn ${activeTab === 'test' ? 'active' : ''}`} 
              onClick={() => setActiveTab('test')}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              title="Test mode - manually enter roll numbers"
            >
              🧪 Test
            </button>
          </div>
          <div className="bs-counter">
            <span className="bs-counter-label">Scanned:</span>
            <span className="bs-counter-value">{Object.keys(queue).length}</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bs-error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Scanner View */}
      {activeTab === 'scan' && scanning && !showSuccess && (
        <div className="bs-scanner-view">
          <div className="bs-video-wrapper">
            <video 
              ref={videoRef}
              className="bs-scanner-video"
              playsInline
              muted
              autoPlay
              controls={false}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
            <div className="bs-scan-overlay">
              <div className="bs-scan-frame"></div>
              <p className="bs-scan-instruction">Position ID card barcode in frame</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
            <p>📷 Camera is active - scanning for barcodes...</p>
          </div>
        </div>
      )}

      {/* Success View */}
      {activeTab === 'scan' && showSuccess && detectedStudent && (
        <div className="bs-success-view">
          <div className="bs-success-icon">
            <CheckCircle size={64} color="#4CAF50" />
          </div>
          
          <h2 className="bs-success-title">✓ Student Verified!</h2>
          
          <div className="bs-student-details">
            <div className="bs-detail-row">
              <span className="bs-detail-label">Roll Number</span>
              <span className="bs-detail-value">{detectedStudent.rollNumber}</span>
            </div>
            <div className="bs-detail-row">
              <span className="bs-detail-label">Admission Year</span>
              <span className="bs-detail-value">{detectedStudent.year}</span>
            </div>
            <div className="bs-detail-row">
              <span className="bs-detail-label">Department</span>
              <span className="bs-detail-value">{detectedStudent.deptName}</span>
            </div>
            <div className="bs-detail-row">
              <span className="bs-detail-label">Year of Study</span>
              <span className="bs-detail-value">{detectedStudent.yearOfStudyLabel}</span>
            </div>
          </div>

          <div className="bs-action-buttons">
            <button className="bs-btn-scan-again" onClick={handleScanAgain}>
              ↻ Scan Another
            </button>
          </div>
        </div>
      )}

      {/* Initial Start Button */}
      {activeTab === 'scan' && !scanning && !showSuccess && (
        <div className="bs-start-view">
          <div className="bs-start-icon">📱</div>
          <h2>Ready to Scan</h2>
          <p>Tap below to start scanning student ID cards</p>
          <button className="bs-btn-start" onClick={startScanning}>
            Start Scanning
          </button>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="bs-summary-view">
          {Object.keys(queue).length === 0 ? (
            <div className="bs-summary-empty">
              <ScanLine size={48} color="#ccc" />
              <p>No scans yet</p>
            </div>
          ) : (
            <div className="bs-summary-content">
              {Object.entries(getAggregated(queue))
                .sort(([a],[b]) => a.localeCompare(b))
                .map(([year, depts]) => (
                  <div key={year} className="bs-year-group">
                    <div className="bs-year-header">{year}</div>
                    {Object.entries(depts)
                      .sort(([a],[b]) => a.localeCompare(b))
                      .map(([deptCode, info]) => (
                        <div key={deptCode} className="bs-dept-group">
                          <div className="bs-dept-header">
                            {info.deptName} — {info.students.length}
                          </div>
                          <div className="bs-student-list">
                            {info.students
                              .sort((a, b) => b.lastSeen - a.lastSeen)
                              .map(s => (
                                <div className="bs-student-row" key={s.rollNumber}>
                                  <span className="bs-student-roll">{s.rollNumber}</span>
                                  <span className="bs-student-time">{formatTime(s.lastSeen)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          )}
          {Object.keys(queue).length > 0 && (
            <div className="bs-summary-actions">
              <button 
                className="bs-btn-submit" 
                onClick={handleSubmitScans}
              >
                ✓ Submit All Scans
              </button>
              <button 
                className="bs-btn-clear" 
                onClick={() => { setQueue({}); persistQueue({}); }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="bs-summary-view" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
          <div className="bs-summary-content" style={{ maxWidth: '100%' }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2 style={{ color: '#2196F3', marginBottom: '1rem' }}>🧪 Test Mode</h2>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Manually enter a roll number to test the scanning flow without a physical barcode.
              </p>
              
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem',
                flexDirection: 'column'
              }}>
                <input
                  type="text"
                  placeholder="Enter roll number (e.g., 230711A0107)"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleTestScan()}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'monospace',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
                <button
                  onClick={handleTestScan}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#1976D2';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#2196F3';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Test Scan
                </button>
              </div>

              <div style={{
                background: '#f0f7ff',
                border: '2px solid #2196F3',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '2rem',
                textAlign: 'left'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2196F3' }}>Format:</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                  2[0-9]07[15]A[0-9]{'{2}'}[A-Z0-9]{'{2}'}
                </p>
                <h4 style={{ margin: '1rem 0 0.5rem 0', color: '#2196F3' }}>Example:</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                  230711A0107 (2023 admission, CSE dept)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add debugging helper to window for development
if (typeof window !== 'undefined') {
  window.__BarcodeDebug__ = {
    getQuaggaState: () => {
      console.log('📊 [QUAGGA STATE]', {
        isInitialized: !!Quagga,
        hasWebcam: !!navigator.mediaDevices
      });
    },
    showQuaggaInfo: () => {
      console.log('%c=== QUAGGA INFO ===', 'color: blue; font-weight: bold');
      console.log('Quagga Library:', Quagga);
      console.log('Quagga.state:', Quagga?.state);
      console.log('Available readers:', Quagga?.readers);
    }
  };
  console.log('🐛 [DEBUG] Use window.__BarcodeDebug__.showQuaggaInfo() to debug');
}

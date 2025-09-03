import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { Eye, Users, Clock, Calendar, Search, Filter, Download} from 'lucide-react';
import {FiRefreshCcw} from 'react-icons/fi';
import axios from 'axios';

const Visitors = () => {
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    activeVisitors: 0,
    todayVisitors: 0,
    thisWeekVisitors: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateVisitors, setDateVisitors] = useState([]);

  useEffect(() => {
    loadVisitorData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadDateVisitors();
    }
  }, [selectedDate]);

  const loadVisitorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Load active visitors
      const activeResponse = await axios.get('/api/admin/visitors/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Load statistics
      const statsResponse = await axios.get('/api/admin/visitors/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setActiveVisitors(activeResponse.data.visitors || []);
      setStats(statsResponse.data.stats || {});
    } catch (error) {
      console.error('Error loading visitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDateVisitors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`/api/admin/visitors/by-date?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDateVisitors(response.data.visitors || []);
    } catch (error) {
      console.error('Error loading date visitors:', error);
      setDateVisitors([]);
    }
  };

  const formatDuration = (entryTime, exitTime) => {
    if (!exitTime) return 'Ongoing';
    
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const duration = exit - entry;
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (visit) => {
    if (!visit.exitTime) {
      return <Badge bg="success">Active</Badge>;
    }
    return <Badge bg="secondary">Completed</Badge>;
  };

  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
    setShowDetailsModal(true);
  };

  const filteredDateVisitors = dateVisitors.filter(visitor => 
    visitor.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <Users className="me-2" size={28} />
          Visitor Management
        </h2>
        <Button variant="outline-primary" onClick={loadVisitorData}>
          <FiRefreshCcw size={16} className="me-1" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-2">
                <Users size={32} />
              </div>
              <h4 className="mb-1">{stats.totalVisitors}</h4>
              <small className="text-muted">Total Visitors</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">
                <Clock size={32} />
              </div>
              <h4 className="mb-1">{stats.activeVisitors}</h4>
              <small className="text-muted">Active Visitors</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">
                <Calendar size={32} />
              </div>
              <h4 className="mb-1">{stats.todayVisitors}</h4>
              <small className="text-muted">Today's Visitors</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">
                <Calendar size={32} />
              </div>
              <h4 className="mb-1">{stats.thisWeekVisitors}</h4>
              <small className="text-muted">This Week</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Active Visitors */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            <Clock className="me-2" size={20} />
            Active Visitors ({activeVisitors.length})
          </h5>
        </Card.Header>
        <Card.Body>
          {activeVisitors.length === 0 ? (
            <div className="text-center py-4">
              <Users size={48} className="text-muted mb-3" />
              <h6 className="text-muted">No active visitors</h6>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Student</th>
                  <th>Purpose</th>
                  <th>Entry Time</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeVisitors.map((visit) => (
                  <tr key={visit._id}>
                    <td>
                      <strong>{visit.visitorName}</strong>
                      {visit.isGroupVisit && (
                        <Badge bg="info" className="ms-2">
                          Group ({visit.groupSize})
                        </Badge>
                      )}
                    </td>
                    <td>{visit.studentName}</td>
                    <td>{visit.purpose}</td>
                    <td>{new Date(visit.entryTime).toLocaleString()}</td>
                    <td>{formatDuration(visit.entryTime)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewDetails(visit)}
                      >
                        <Eye size={14} className="me-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Date Selection and Visitors */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <Calendar className="me-2" size={20} />
              Visitors by Date
            </h5>
            <div className="d-flex gap-2 align-items-center">
              <label className="form-label mb-0 me-2">Select Date:</label>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '200px' }}
              />
              <Form.Control
                type="text"
                placeholder="Search visitors..."
                size="sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '200px' }}
              />
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <h6 className="text-primary">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} - {filteredDateVisitors.length} visitors
            </h6>
          </div>
          
          {filteredDateVisitors.length === 0 ? (
            <div className="text-center py-5">
              <Calendar size={48} className="text-muted mb-3" />
              <h6 className="text-muted">No visitors found for this date</h6>
              <p className="text-muted small">
                Try selecting a different date or check if visitors were recorded
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {filteredDateVisitors.map((visitor, index) => (
                <div key={index} className="col-md-6">
                  <div className="card border h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="card-title text-primary mb-1">{visitor.visitorName}</h6>
                          {visitor.isGroupVisit && (
                            <Badge bg="info" className="mb-2">
                              Group Visit ({visitor.groupSize} people)
                            </Badge>
                          )}
                        </div>
                        <Badge bg={visitor.status === 'active' ? 'success' : 'secondary'}>
                          {visitor.status}
                        </Badge>
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted d-block">
                          <strong>Student:</strong> {visitor.studentName}
                        </small>
                        <small className="text-muted d-block">
                          <strong>Purpose:</strong> {visitor.purpose}
                        </small>
                        {visitor.visitorPhone && (
                          <small className="text-muted d-block">
                            <strong>Phone:</strong> {visitor.visitorPhone}
                          </small>
                        )}
                      </div>
                      
                      <div className="border-top pt-2">
                        <small className="text-muted d-block">
                          <strong>Entry:</strong> {new Date(visitor.entryTime).toLocaleTimeString()}
                        </small>
                        {visitor.exitTime && (
                          <small className="text-muted d-block">
                            <strong>Exit:</strong> {new Date(visitor.exitTime).toLocaleTimeString()}
                          </small>
                        )}
                        <small className="text-muted d-block">
                          <strong>Duration:</strong> {formatDuration(visitor.entryTime, visitor.exitTime)}
                        </small>
                      </div>
                      
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="mt-2 w-100"
                        onClick={() => handleViewDetails(visitor)}
                      >
                        <Eye size={14} className="me-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Visit History */}
      {/* <Card className="border-0 shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0">
              <Calendar className="me-2" size={20} />
              Visit History
            </h5>
            <div className="d-flex gap-2 flex-wrap">
              <Form.Control
                type="text"
                placeholder="Search visit history..."
                size="sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '200px' }}
              />
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Student</th>
                <th>Purpose</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visitHistory.filter(visit => 
                visit.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                visit.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                visit.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((visit) => (
                <tr key={visit._id}>
                  <td>
                    <strong>{visit.visitorName}</strong>
                    {visit.isGroupVisit && (
                      <Badge bg="info" className="ms-2">
                        Group ({visit.groupSize})
                      </Badge>
                    )}
                  </td>
                  <td>{visit.studentName}</td>
                  <td>{visit.purpose}</td>
                  <td>{new Date(visit.entryTime).toLocaleString()}</td>
                  <td>
                    {visit.exitTime 
                      ? new Date(visit.exitTime).toLocaleString() 
                      : '-'
                    }
                  </td>
                  <td>{formatDuration(visit.entryTime, visit.exitTime)}</td>
                  <td>{getStatusBadge(visit)}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleViewDetails(visit)}
                    >
                      <Eye size={14} className="me-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {visitHistory.filter(visit => 
            visit.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visit.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 && (
            <div className="text-center py-4">
              <Calendar size={48} className="text-muted mb-3" />
              <h6 className="text-muted">No visits found</h6>
              <p className="text-muted small">
                Try adjusting your search or date filter
              </p>
            </div>
          )}
        </Card.Body>
      </Card> */}

      {/* Visit Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Visit Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVisit && (
            <Row>
              <Col md={6}>
                <h6>Visitor Information</h6>
                <p><strong>Name:</strong> {selectedVisit.visitorName}</p>
                <p><strong>Phone:</strong> {selectedVisit.visitorPhone || 'N/A'}</p>
                <p><strong>Purpose:</strong> {selectedVisit.purpose}</p>
                {selectedVisit.isGroupVisit && (
                  <p><strong>Group Size:</strong> {selectedVisit.groupSize} people</p>
                )}
              </Col>
              <Col md={6}>
                <h6>Visit Information</h6>
                <p><strong>Student:</strong> {selectedVisit.studentName}</p>
                <p><strong>Entry Time:</strong> {new Date(selectedVisit.entryTime).toLocaleString()}</p>
                <p><strong>Exit Time:</strong> {
                  selectedVisit.exitTime 
                    ? new Date(selectedVisit.exitTime).toLocaleString()
                    : 'Still visiting'
                }</p>
                <p><strong>Duration:</strong> {formatDuration(selectedVisit.entryTime, selectedVisit.exitTime)}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedVisit)}</p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Visitors;

import jsPDF from 'jspdf';

// Function to export data to CSV
export const exportToCSV = (data, filename) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Function to convert data to CSV format
const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
};

// Function to export analytics data to PDF
export const exportAnalyticsToPDF = (analyticsData, filters) => {
    const pdf = new jsPDF();
    let yPosition = 20;
    
    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Food Management Analytics Report', 20, yPosition);
    yPosition += 20;
    
    // Report metadata
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`, 20, yPosition);
    yPosition += 10;
    
    pdf.text(`Date Range: ${filters.dateFilter}`, 20, yPosition);
    yPosition += 10;
    
    pdf.text(`Meal Types: ${filters.mealTypes.replace(/,/g, ', ')}`, 20, yPosition);
    yPosition += 20;
    
    // Summary Statistics
    pdf.setFontSize(16);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Summary Statistics', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    const summaryData = [
        ['Total Meals Served', analyticsData.summary.totalMealsServed],
        ['Total Meals Paused', analyticsData.summary.totalMealsPaused],
        ['Total Meals Resumed', analyticsData.summary.totalMealsResumed],
        ['Pause Percentage', `${analyticsData.summary.pausePercentage.toFixed(1)}%`],
        ['Average Pauses per Student', analyticsData.summary.averagePausesPerStudent.toFixed(1)],
        ['Peak Pause Day', analyticsData.summary.peakPauseDay || 'N/A'],
        ['Most Paused Meal', analyticsData.summary.peakPauseMeal || 'N/A']
    ];
    
    summaryData.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 25, yPosition);
        yPosition += 8;
    });
    
    yPosition += 10;
    
    // Meal Type Distribution
    pdf.setFontSize(16);
    pdf.text('Meal Type Distribution', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    Object.entries(analyticsData.distributions.mealTypes).forEach(([meal, data]) => {
        pdf.text(`${meal.charAt(0).toUpperCase() + meal.slice(1)}:`, 25, yPosition);
        pdf.text(`Served: ${data.served}, Paused: ${data.paused}, Resumed: ${data.resumed}`, 35, yPosition + 6);
        yPosition += 15;
    });
    
    // Check if we need a new page
    if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
    }
    
    // Key Insights
    pdf.setFontSize(16);
    pdf.text('Key Insights', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    if (analyticsData.insights.length > 0) {
        analyticsData.insights.forEach((insight, index) => {
            const lines = pdf.splitTextToSize(`• ${insight}`, 170);
            lines.forEach(line => {
                if (yPosition > 280) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.text(line, 25, yPosition);
                yPosition += 6;
            });
            yPosition += 4;
        });
    } else {
        pdf.text('No significant patterns detected in the current data range.', 25, yPosition);
    }
    
    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, 20, 290);
        pdf.text('VJ Hostels - Food Management System', 120, 290);
    }
    
    // Save the PDF
    const filename = `food-analytics-report-${filters.dateFilter}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
};

// Function to export daily trends to CSV
export const exportDailyTrendsToCSV = (dailyTrends) => {
    const csvData = dailyTrends.map(day => ({
        Date: new Date(day.date).toLocaleDateString(),
        'Meals Served': day.served,
        'Meals Paused': day.paused,
        'Meals Resumed': day.resumed
    }));
    
    exportToCSV(csvData, `daily-trends-${new Date().toISOString().split('T')[0]}.csv`);
};

// Function to export meal type distribution to CSV
export const exportMealDistributionToCSV = (mealDistribution) => {
    const csvData = Object.entries(mealDistribution).map(([meal, data]) => ({
        'Meal Type': meal.charAt(0).toUpperCase() + meal.slice(1),
        'Served': data.served,
        'Paused': data.paused,
        'Resumed': data.resumed
    }));
    
    exportToCSV(csvData, `meal-distribution-${new Date().toISOString().split('T')[0]}.csv`);
};

// Function to export weekday analysis to CSV
export const exportWeekdayAnalysisToCSV = (weekdayDistribution) => {
    const csvData = Object.entries(weekdayDistribution).map(([day, data]) => ({
        'Day of Week': day,
        'Served': data.served,
        'Paused': data.paused,
        'Resumed': data.resumed
    }));
    
    exportToCSV(csvData, `weekday-analysis-${new Date().toISOString().split('T')[0]}.csv`);
};

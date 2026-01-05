import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFCertificate } from '../PDFCertificate';
import { PDFTable } from '../PDFTable';
import { NVPCTestData } from '@/types/test-certificates';

// Format date from YYYY-MM-DD to DD/MM/YYYY
function formatDateForPDF(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  tableContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    minHeight: 18,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    borderBottom: '2 solid #000',
  },
  tableCell: {
    padding: 4,
    fontSize: 7,
    borderRight: '1 solid #ddd',
    borderBottom: '1 solid #ddd',
  },
  tableCellLast: {
    borderRight: 'none',
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  headerCell: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  mergedHeader: {
    textAlign: 'center',
  },
});

interface NVPCCertificateProps {
  data: NVPCTestData;
}

export function NVPCCertificate({ data }: NVPCCertificateProps) {
  // Build table data for all rooms
  const allTableData: (string | number)[][] = [];
  const roomSummaries: Array<{ roomName: string; roomNumber: string; mean05: number; mean5: number; status: string }> = [];

  data.rooms.forEach((room) => {
    // Collect room summary
    if (room.mean05 !== undefined && room.mean5 !== undefined) {
      roomSummaries.push({
        roomName: room.roomName,
        roomNumber: room.roomNumber || '',
        mean05: room.mean05,
        mean5: room.mean5,
        status: room.roomStatus || 'PASS',
      });
    }

    // Add room name only on first row of each room
    let isFirstPoint = true;
    room.samplingPoints.forEach((point) => {
      // Get S1 value (first reading) or 0 if no readings
      const s1_05 = point.readings05.length > 0 ? point.readings05[0] : 0;
      const s1_5 = point.readings5.length > 0 ? point.readings5[0] : 0;
      
      const row: (string | number)[] = [
        point.location || point.pointId || '', // Location
        s1_05, // S1 for ≥0.5μm
        point.average05, // Average for ≥0.5μm
        s1_5, // S1 for ≥5μm
        point.average5, // Average for ≥5μm
      ];
      allTableData.push(row);
      isFirstPoint = false;
    });
  });

  const columnWidths = [20, 15, 15, 15, 15];

  return (
    <PDFCertificate
      title="Airborne Particle Count Test At Rest for Classification of Clean Air and Clean Air Devices"
      clientInfo={data.clientInfo}
      certificateNo={data.certificateNo}
      date={formatDateForPDF(data.date)}
      areaClassification={data.areaClassification}
      instrument={data.instrument}
      ahuNumber={data.ahuNumber}
      areaName={data.areaName}
      inference={data.inference}
      preparedBy={data.preparedBy}
      approvedBy={data.approvedBy}
    >
      <View style={styles.tableContainer}>
        <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 5 }}>* Obtained Test Results *</Text>
        
        {/* Room Summary Section */}
        {roomSummaries.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 5 }}>Room Summary (Mean Values):</Text>
            {roomSummaries.map((summary, idx) => (
              <View key={idx} style={{ marginBottom: 5, padding: 5, backgroundColor: '#f9f9f9' }}>
                <Text style={{ fontSize: 7, fontWeight: 'bold' }}>
                  {summary.roomName}{summary.roomNumber ? ` (${summary.roomNumber})` : ''}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                  <Text style={{ fontSize: 7, width: '50%' }}>
                    ≥0.5µm Mean: {summary.mean05.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={{ fontSize: 7, width: '50%' }}>
                    ≥5.0µm Mean: {summary.mean5.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={{ fontSize: 7, marginLeft: 10, fontWeight: 'bold' }}>
                    Status: {summary.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.table}>
          {/* First Header Row - Main headers */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.headerCell, { width: '20%' }]}>Location</Text>
            <Text style={[styles.tableCell, styles.headerCell, styles.mergedHeader, { width: '30%' }]}>
              No.of Particles ≥ 0.5 µm/m³
            </Text>
            <Text style={[styles.tableCell, styles.headerCell, styles.mergedHeader, { width: '30%' }]}>
              No.of Particles ≥ 5.0 µm/m³
            </Text>
          </View>
          {/* Second Header Row - Sub-columns */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: '20%', backgroundColor: '#f0f0f0' }]}></Text>
            <Text style={[styles.tableCell, styles.headerCell, styles.textCenter, { width: '15%' }]}>S1</Text>
            <Text style={[styles.tableCell, styles.headerCell, styles.textCenter, { width: '15%' }]}>Average</Text>
            <Text style={[styles.tableCell, styles.headerCell, styles.textCenter, { width: '15%' }]}>S1</Text>
            <Text style={[styles.tableCell, styles.headerCell, styles.textCenter, { width: '15%' }]}>Average</Text>
          </View>

          {/* Data Rows */}
          {allTableData.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '20%' }]}>{row[0]}</Text>
              <Text style={[styles.tableCell, styles.textRight, { width: '15%' }]}>{row[1]}</Text>
              <Text style={[styles.tableCell, styles.textRight, { width: '15%' }]}>{row[2]}</Text>
              <Text style={[styles.tableCell, styles.textRight, { width: '15%' }]}>{row[3]}</Text>
              <Text style={[styles.tableCell, styles.textRight, { width: '15%' }]}>{row[4]}</Text>
            </View>
          ))}
        </View>
      </View>
    </PDFCertificate>
  );
}


import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFCertificate } from '../PDFCertificate';
import { PDFTable } from '../PDFTable';
import { RecoveryTestData } from '@/types/test-certificates';

const styles = StyleSheet.create({
  tableContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  recoveryTime: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f5f5f5',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

interface RecoveryTestCertificateProps {
  data: RecoveryTestData;
}

export function RecoveryTestCertificate({ data }: RecoveryTestCertificateProps) {
  const tableData: (string | number)[][] = data.timeSeries.map((point) => [
    point.time,
    point.ahuStatus,
    point.particleCount05,
    point.particleCount5,
  ]);

  const headers = ['Time', 'AHU ON/OFF Status', 'No. of Particle ≥ 0.5 µm/m³', 'No. of Particles ≥ 5 µm/m³'];

  const columnWidths = [15, 15, 35, 35];

  return (
    <PDFCertificate
      title="Recovery Test"
      clientInfo={data.clientInfo}
      certificateNo={data.certificateNo}
      date={data.date}
      areaClassification={data.areaClassification}
      instrument={data.instrument}
      ahuNumber={data.ahuNumber}
      areaName={data.roomName ? (data.roomNumber ? `${data.roomName} (${data.roomNumber})` : data.roomName) : undefined}
      preparedBy={data.preparedBy}
      approvedBy={data.approvedBy}
    >
      {/* Test Condition */}
      {data.testCondition && (
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <Text style={{ fontWeight: 'bold', width: '30%' }}>Test Condition:</Text>
            <Text style={{ width: '70%' }}>{data.testCondition}</Text>
          </View>
        </View>
      )}

      <View style={styles.tableContainer}>
        <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 5 }}>* OBTAINED TEST RESULTS *</Text>
        <PDFTable
          headers={headers}
          data={tableData}
          columnWidths={columnWidths}
          alignCenter={[1]}
          alignRight={[2, 3]}
        />
      </View>
      
      {data.recoveryTime > 0 && (
        <View style={styles.recoveryTime}>
          <Text>Recovery Time: {data.recoveryTime} minute{data.recoveryTime !== 1 ? 's' : ''}</Text>
          {data.testStatus && (
            <Text style={{ marginTop: 5 }}>
              Test Status: {data.testStatus} (Acceptance Limit: ≤ 15 minutes)
            </Text>
          )}
        </View>
      )}
      
      {data.auditStatement && (
        <View style={{ marginTop: 10, padding: 8, backgroundColor: '#f9f9f9', fontSize: 9 }}>
          <Text style={{ fontStyle: 'italic' }}>{data.auditStatement}</Text>
        </View>
      )}
    </PDFCertificate>
  );
}


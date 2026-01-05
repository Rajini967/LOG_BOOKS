import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFCertificate } from '../PDFCertificate';
import { PDFTable } from '../PDFTable';
import { DifferentialPressureTestData } from '@/types/test-certificates';

const styles = StyleSheet.create({
  tableContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
});

interface DifferentialPressureCertificateProps {
  data: DifferentialPressureTestData;
}

export function DifferentialPressureCertificate({ data }: DifferentialPressureCertificateProps) {
  const tableData: (string | number)[][] = data.readings.map((reading) => [
    reading.roomPositive,
    reading.roomNegative,
    reading.dpReading,
    `NLT ${reading.limit} Pa`,
    reading.testStatus,
  ]);

  const headers = ['Room (+)', 'Room (-)', 'DP Reading (Pa)', 'Limit', 'Status'];

  const columnWidths = [25, 25, 20, 15, 15];

  return (
    <PDFCertificate
      title="Differential Pressure Test"
      clientInfo={data.clientInfo}
      certificateNo={data.certificateNo}
      date={data.date}
      instrument={data.instrument}
      ahuNumber={data.ahuNumber}
      preparedBy={data.preparedBy}
      approvedBy={data.approvedBy}
    >
      <View style={styles.tableContainer}>
        <PDFTable
          headers={headers}
          data={tableData}
          columnWidths={columnWidths}
          alignCenter={[3]}
          alignRight={[1]}
        />
      </View>
    </PDFCertificate>
  );
}


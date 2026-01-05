import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader } from '../PDFHeader';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  table: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #000',
    minHeight: 20,
  },
  tableHeader: {
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
    borderBottom: '2 solid #000',
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    borderRight: '1 solid #000',
    textAlign: 'center',
  },
  tableCellLeft: {
    textAlign: 'left',
  },
  tableCellLast: {
    borderRight: 'none',
  },
  footer: {
    marginTop: 20,
    fontSize: 10,
  },
  footerLine: {
    marginBottom: 5,
  },
});

interface ChemicalMonitoringData {
  logs: Array<{
    date: string;
    time: string;
    equipmentName: string;
    chemicalName?: string;
    chemicalPercent?: number;
    solutionConcentration?: number;
    waterQty?: number;
    chemicalQty?: number;
    remarks?: string;
    checkedBy?: string;
  }>;
}

interface ChemicalMonitoringCertificateProps {
  data: ChemicalMonitoringData;
}

export function ChemicalMonitoringCertificate({ data }: ChemicalMonitoringCertificateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader />
        
        <Text style={styles.title}>RAW DATA FOR CHEMICAL MONITORING</Text>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: '10%' }]}>Date</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>Time</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>EqP Name</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>Chemical name</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>Chemical %</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>Solution concentration %</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>Water Qty</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>Chemical Qty</Text>
            <Text style={[styles.tableCell, { width: '7%' }]}>Remarks</Text>
            <Text style={[styles.tableCell, { width: '7%' }, styles.tableCellLast]}>Checked By</Text>
          </View>

          {/* Data Rows */}
          {data.logs.map((log, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '10%' }]}>{log.date === 'Automatic' || !log.date ? 'Automatic' : log.date}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{log.time === 'Automatic' || !log.time ? 'Automatic' : log.time}</Text>
              <Text style={[styles.tableCell, styles.tableCellLeft, { width: '12%' }]}>
                {log.equipmentName || ''}
              </Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>
                {log.chemicalName || ''}
              </Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>
                {log.chemicalPercent !== undefined ? `${log.chemicalPercent}% - Automatic` : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>
                {log.solutionConcentration !== undefined ? `${log.solutionConcentration} %` : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>
                {log.waterQty !== undefined ? `${log.waterQty} L` : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>
                {log.chemicalQty !== undefined ? `${log.chemicalQty} G` : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '7%' }]}>
                {log.remarks || '-'}
              </Text>
              <Text style={[styles.tableCell, { width: '7%' }, styles.tableCellLast]}>
                {log.checkedBy || ''}
              </Text>
            </View>
          ))}

          {/* Empty rows for additional entries */}
          {Array.from({ length: Math.max(0, 10 - data.logs.length) }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '10%' }]}></Text>
              <Text style={[styles.tableCell, { width: '10%' }]}></Text>
              <Text style={[styles.tableCell, { width: '12%' }]}></Text>
              <Text style={[styles.tableCell, { width: '12%' }]}></Text>
              <Text style={[styles.tableCell, { width: '10%' }]}></Text>
              <Text style={[styles.tableCell, { width: '12%' }]}></Text>
              <Text style={[styles.tableCell, { width: '10%' }]}></Text>
              <Text style={[styles.tableCell, { width: '10%' }]}></Text>
              <Text style={[styles.tableCell, { width: '7%' }]}></Text>
              <Text style={[styles.tableCell, { width: '7%' }, styles.tableCellLast]}></Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLine}>Remarks:</Text>
          <Text style={styles.footerLine}>Digital sign</Text>
        </View>
      </Page>
    </Document>
  );
}


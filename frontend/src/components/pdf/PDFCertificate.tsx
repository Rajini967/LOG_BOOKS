import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';

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
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  infoSection: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: '30%',
  },
  infoValue: {
    width: '70%',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
});

interface PDFCertificateProps {
  title: string;
  children: React.ReactNode;
  clientInfo: {
    name: string;
    address: string;
  };
  certificateNo: string;
  date: string;
  testReference?: string;
  areaClassification?: string;
  instrument: {
    name: string;
    make: string;
    model: string;
    serialNumber: string;
    calibrationDate: string;
    calibrationDueDate: string;
  };
  ahuNumber: string;
  areaName?: string;
  inference?: string;
  preparedBy?: string;
  approvedBy?: string;
}

export function PDFCertificate({
  title,
  children,
  clientInfo,
  certificateNo,
  date,
  testReference,
  areaClassification,
  instrument,
  ahuNumber,
  areaName,
  inference,
  preparedBy,
  approvedBy,
}: PDFCertificateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader />
        
        <Text style={styles.title}>TEST CERTIFICATE</Text>
        <Text style={styles.sectionTitle}>{title}</Text>

        {/* Client Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>{clientInfo.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}></Text>
            <Text style={styles.infoValue}>{clientInfo.address}</Text>
          </View>
        </View>

        {/* Certificate Details */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Certificate No:</Text>
            <Text style={styles.infoValue}>{certificateNo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Test:</Text>
            <Text style={styles.infoValue}>{date}</Text>
          </View>
          {testReference && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Test Reference:</Text>
              <Text style={styles.infoValue}>{testReference}</Text>
            </View>
          )}
          {areaClassification && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Area Classification:</Text>
              <Text style={styles.infoValue}>{areaClassification}</Text>
            </View>
          )}
        </View>

        {/* Instrument Used */}
        <Text style={styles.sectionTitle}>Instrument Used</Text>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Instrument Used:</Text>
            <Text style={styles.infoValue}>{instrument.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Make:</Text>
            <Text style={styles.infoValue}>{instrument.make}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Model:</Text>
            <Text style={styles.infoValue}>{instrument.model}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>S No:</Text>
            <Text style={styles.infoValue}>{instrument.serialNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Calibration On:</Text>
            <Text style={styles.infoValue}>
              {instrument.calibrationDate ? formatDateForPDF(instrument.calibrationDate) : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Calibration Due On:</Text>
            <Text style={styles.infoValue}>
              {instrument.calibrationDueDate ? formatDateForPDF(instrument.calibrationDueDate) : ''}
            </Text>
          </View>
          {instrument.flowRate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Instrument Flow Rate:</Text>
              <Text style={styles.infoValue}>{instrument.flowRate}</Text>
            </View>
          )}
          {instrument.samplingTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sampling Time:</Text>
              <Text style={styles.infoValue}>{instrument.samplingTime}</Text>
            </View>
          )}
        </View>

        {/* AHU Number and Area Name */}
        <View style={styles.infoSection}>
          {areaName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Area Name:</Text>
              <Text style={styles.infoValue}>{areaName}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AHU No:</Text>
            <Text style={styles.infoValue}>{ahuNumber}</Text>
          </View>
        </View>

        {/* Test Results - Children content */}
        {children}

        <PDFFooter 
          inference={inference}
          preparedBy={preparedBy}
          approvedBy={approvedBy}
        />
      </Page>
    </Document>
  );
}


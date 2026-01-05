import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #ccc',
  },
  inference: {
    marginBottom: 30,
    fontSize: 10,
  },
  inferenceLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 10,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  signatureLine: {
    borderTop: '1 solid #000',
    marginTop: 40,
    paddingTop: 5,
    fontSize: 9,
  },
});

interface PDFFooterProps {
  inference?: string;
  preparedBy?: string;
  approvedBy?: string;
}

export function PDFFooter({ inference, preparedBy, approvedBy }: PDFFooterProps) {
  return (
    <View style={styles.footer}>
      {inference && (
        <View style={styles.inference}>
          <Text style={styles.inferenceLabel}>INFERENCE:</Text>
          <Text>{inference}</Text>
        </View>
      )}
      
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Prepared by/Performed by</Text>
          {preparedBy && (
            <View style={styles.signatureLine}>
              <Text>{preparedBy}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Test Approved By</Text>
          {approvedBy && (
            <View style={styles.signatureLine}>
              <Text>{approvedBy}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}


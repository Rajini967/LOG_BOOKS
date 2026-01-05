import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  companySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
});

interface PDFHeaderProps {
  companyName?: string;
  subtitle?: string;
  address?: string;
}

export function PDFHeader({ 
  companyName = 'SVU ENTERPRISES',
  subtitle = 'ENGINEERING & PHARMA SERVICES',
  address = 'SVU Enterprises, Novus florance apartments E-411, Gajuwaka, Visakhapatnam, Andhra Pradesh, 530044'
}: PDFHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.companyName}>{companyName}</Text>
      <Text style={styles.companySubtitle}>{subtitle}</Text>
      <Text style={styles.companyAddress}>{address}</Text>
    </View>
  );
}


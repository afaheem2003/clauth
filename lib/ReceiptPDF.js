import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
  },
  items: {
    marginTop: 30,
    marginBottom: 30,
  },
  itemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  itemName: {
    flex: 2,
  },
  itemSize: {
    flex: 1,
    textAlign: 'center',
  },
  itemQty: {
    flex: 1,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1,
    textAlign: 'right',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  footer: {
    marginTop: 50,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default function ReceiptPDF({ name, email, items, total, date }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Clauth</Text>
          <Text style={styles.title}>Order Receipt</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{name}</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{date}</Text>
        </View>

        {/* Items */}
        <View style={styles.items}>
          <View style={[styles.itemRow, { fontWeight: 'bold' }]}>
            <Text style={styles.itemName}>Item</Text>
            <Text style={styles.itemSize}>Size</Text>
            <Text style={styles.itemQty}>Qty</Text>
            <Text style={styles.itemPrice}>Price</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSize}>{item.size}</Text>
              <Text style={styles.itemQty}>{item.quantity}</Text>
              <Text style={styles.itemPrice}>${(total / items.length).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.total}>
            <Text>Total</Text>
            <Text>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for shopping with Clauth!</Text>
          <Text>For any questions, please contact support@clauth.com</Text>
        </View>
      </Page>
    </Document>
  );
}

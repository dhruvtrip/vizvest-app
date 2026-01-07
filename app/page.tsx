'use client'

import { useState } from 'react'
import { CSVUpload } from '@/components/features/csv-upload'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Trading212Transaction } from '@/types/trading212'

export default function Home() {
  const [transactions, setTransactions] = useState<Trading212Transaction[]>([])

  const handleDataParsed = (data: Trading212Transaction[]) => {
    setTransactions(data)
    console.log('Parsed transactions:', data)
  }

  return (
    <main className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Vizvest</h1>
        <p className="text-xl text-muted-foreground">
          Trading 212 Portfolio Analysis & Visualization
        </p>
      </header>

      {/* CSV Upload Section */}
      <ErrorBoundary>
        <CSVUpload onDataParsed={handleDataParsed} />
      </ErrorBoundary>

      {/* Data Preview Section */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Preview</CardTitle>
            <CardDescription>
              Showing first 5 transactions from your CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Action</th>
                    <th className="text-left p-2 font-medium">Time</th>
                    <th className="text-left p-2 font-medium">Ticker</th>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-right p-2 font-medium">Shares</th>
                    <th className="text-right p-2 font-medium">Price</th>
                    <th className="text-right p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{transaction.Action}</td>
                      <td className="p-2 text-muted-foreground">{transaction.Time}</td>
                      <td className="p-2 font-medium">{transaction.Ticker || '-'}</td>
                      <td className="p-2">{transaction.Name || '-'}</td>
                      <td className="p-2 text-right">
                        {transaction['No. of shares'] !== undefined ? transaction['No. of shares'] : '-'}
                      </td>
                      <td className="p-2 text-right">
                        {transaction['Price / share'] !== undefined 
                          ? `${transaction['Price / share'].toFixed(2)} ${transaction['Currency (Price / share)'] || ''}` 
                          : '-'}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {transaction.Total.toFixed(2)} {transaction['Currency (Total)']}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length > 5 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  ...and {transactions.length - 5} more transactions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started Section */}
      {transactions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              How to export your Trading 212 data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open the Trading 212 app or website</li>
              <li>Navigate to your account history</li>
              <li>Look for the export or download option</li>
              <li>Select CSV format</li>
              <li>Upload the downloaded file above</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p className="font-medium">Required CSV Columns:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Action</li>
                <li>Ticker</li>
                <li>No. of shares</li>
                <li>Price / share</li>
                <li>Total</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}


import { DateTime } from "luxon"
import { google } from "googleapis";

type SalesSheetForm = {
    iten_name: string
    quantity: number
    price: number
    payment_method: string
    userId: string
    discount: number
    discountDescription: string
    seqNo?:string
    tableNo?:number | undefined
}

type InventorySheetForm = {
    iten_name: string
    units: number
    sale_price: number
    cost_price: number
    userId: string
}

type ReverseOrderForm = {
  orderID: string
  originalOrderId: string
  added_by: string
  item: {
    name: string
    quantity: number
    sale_price: number
  }
  discount: number
  discountDescription: string
}



const TZ = process.env.NEXT_PUBLIC_TIMEZONE ?? "UTC";

// Get current time in configured timezone as ISO string
const getNowPK = () =>
  DateTime.now().setZone(TZ).toISO({ suppressMilliseconds: true })


export const getGoogleSheets = () => {

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ]
  })

  const sheets = google.sheets({
    auth, 
    version: 'v4',
  })

  return sheets
}

export const addSalesToSheet = async (rows: SalesSheetForm[]) => {
  const sheets = getGoogleSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sales',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows.map(r => [
        r.iten_name,
        r.quantity,
        r.price,
        r.payment_method,
        r.userId,
        getNowPK(),
        r.discount,
        r.discountDescription,
        r.seqNo,
        r.tableNo
      ])
    }
  })
}


export const getTotalDiscount = async (): Promise<number> => {
  const sheets = getGoogleSheets()

  // Assuming discount is in column G (7th column in your append)
  const range = "Sales!G2:G" // skip header row if you have one
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range,
  })

  const values = res.data.values || []

  // Convert to numbers and sum
  const total = values
    .map(row => Number(row[0]) || 0)
    .reduce((sum, val) => sum + val, 0)

  // console.log(total)  
  return total
}


export const addInventoryToSheet = async (rows: InventorySheetForm[]) => {
  const sheets = getGoogleSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Inventory',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows.map(r => [
        r.iten_name,
        r.units,
        r.sale_price,
        r.cost_price,
        r.userId,
        getNowPK()
      ])
    }
  })
}

export const updateExistingInventoryInSheet = async (row: InventorySheetForm, rowIndex: number) => {
  const sheets = getGoogleSheets()
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Inventory!A${rowIndex}:F${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        row.iten_name,
        row.units,
        row.sale_price,
        row.cost_price,
        row.userId,
        getNowPK()
      ]]
    }
  })
}

export const addInventoryLogsToSheet = async (rows: InventorySheetForm[]) => {
  const sheets = getGoogleSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Inventory Logs',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows.map(r => [
        r.iten_name,
        r.units,
        r.sale_price,
        r.cost_price,
        r.userId,
        getNowPK()
      ])
    }
  })
}

export const addReverseOrderLogToSheet = async (rows: ReverseOrderForm[]) => {
  const sheets = getGoogleSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Reversed Orders',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows.map(r => [
        r.item.name,
        r.item.quantity,
        r.item.sale_price,
        r.added_by,
        r.discount,
        r.discountDescription,
        r.orderID,
        r.originalOrderId,
        getNowPK()
      ])
    }
  })
}

export const addExpensesToSheet = async (rows: { description: string, amount: number, userId: string }[]) => {
  const sheets = getGoogleSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Expenses',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows.map(r => [
        r.description,
        r.amount,
        r.userId,
        getNowPK()
      ])
    }
  })
}

export const addInvestmentsToSheet = async (rows: { description: string, amount: number, userId: string }[]) => {
  const sheets = getGoogleSheets()
  await sheets.spreadsheets.values.append({ 
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Investments',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows.map(r => [ 
        r.description,
        r.amount,
        r.userId,
        getNowPK()
      ])
    }
  })
}

export const findInventoryRowIndex = async (itemName: string) => {
  const sheets = getGoogleSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Inventory!A:A',
  })

  const rows = res.data.values || []
  const index = rows.findIndex(r => r[0] === itemName)

  if (index === -1) return null
  return index + 1
}

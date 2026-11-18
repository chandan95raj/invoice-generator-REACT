import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  ThemeProvider,
  Tooltip,
  createTheme,
} from '@mui/material'
import {
  ArrowDownToLine,
  ArrowLeftRight,
  AlertTriangle,
  Check,
  CircleHelp,
  FileText,
  ImagePlus,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const STORAGE_KEY = 'invoice-v1'
const today = new Date().toISOString().slice(0, 10)
const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)

const initialInvoice = {
  theme: 'light',
  template: 'Modern',
  accent: '#6757e8',
  currency: '₹',
  taxMode: 'simple',
  taxModeChosen: false,
  paymentStatus: 'due',
  interstate: false,
  discount: 0,
  invoiceNumber: 'INV-001',
  invoiceDate: today,
  dueDate,
  businessName: 'Northstar Studio',
  businessAddress: '48, Green Park Extension\nNew Delhi, Delhi 110016',
  businessEmail: 'hello@northstar.studio',
  businessPhone: '+91 98765 43210',
  taxId: '07AABCU9603R1ZM',
  logo: '',
  clientName: 'Aarav SHarma',
  clientAddress: '22, Palm Avenue\nMumbai, Maharashtra 400050',
  clientEmail: 'aarav@mehtacreative.in',
  items: [
    { id: 1, description: 'Brand identity design', detail: 'Visual identity, guidelines & assets', quantity: 1, rate: 24000, tax: 18 },
    { id: 2, description: 'Website design', detail: 'Landing page & responsive layouts', quantity: 1, rate: 18000, tax: 18 },
    { id: 3, description: 'Social media kit', detail: '12 branded post templates', quantity: 2, rate: 4500, tax: 18 },
  ],
  upiId: 'northstar@okaxis',
  bankName: 'HDFC Bank',
  accountName: 'Northstar Studio',
  accountNumber: '50100123456789',
  ifsc: 'HDFC0001234',
  notes: 'Thank you for trusting us with your project.',
  terms: 'Payment is due within 14 days of invoice date.',
  signatory: 'Riya Sharma',
  signature: '',
}

const muiTheme = createTheme({
  typography: { fontFamily: 'Poppins, sans-serif', button: { textTransform: 'none', fontWeight: 600 } },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 10, boxShadow: 'none' } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
  },
})

const money = (amount, currency) =>
  `${currency}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function readSavedInvoice() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialInvoice
    const parsed = JSON.parse(saved)
    return {
      ...initialInvoice,
      ...parsed,
      taxMode: parsed.taxModeChosen ? parsed.taxMode : 'simple',
      taxModeChosen: Boolean(parsed.taxModeChosen),
      items: Array.isArray(parsed.items) ? parsed.items : initialInvoice.items,
    }
  } catch (error) {
    console.error('Unable to load the saved invoice.', error)
    return initialInvoice
  }
}

function Field({ label, className = '', ...props }) {
  return (
    <TextField
      className={`form-field ${className}`}
      label={label}
      variant="outlined"
      size="small"
      fullWidth
      {...props}
    />
  )
}

function SectionTitle({ number, title, action }) {
  return (
    <div className="section-title">
      <div className="section-number">{number}</div>
      <h2>{title}</h2>
      {action}
    </div>
  )
}

function App() {
  const [invoice, setInvoice] = useState(readSavedInvoice)
  const [storageError, setStorageError] = useState('')
  const [mobileView, setMobileView] = useState('editor')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--scrollbar-thumb', invoice.accent)
  }, [invoice.accent])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice))
    } catch (error) {
      console.error('Unable to save the invoice in this browser.', error)
      setStorageError('Could not save your changes. Your browser storage may be full.')
    }
  }, [invoice])

  const update = (key, value) => {
    setStorageError('')
    setInvoice((current) => ({
      ...current,
      [key]: value,
      ...(key === 'taxMode' ? { taxModeChosen: true } : {}),
    }))
  }
  const updateItem = (id, key, value) => {
    setStorageError('')
    const boundedValue = ['quantity', 'rate', 'tax'].includes(key) && value !== ''
      ? Math.max(0, Math.min(key === 'tax' ? 100 : Infinity, Number(value) || 0))
      : value
    setInvoice((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, [key]: boundedValue } : item)),
    }))
  }

  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0)
    const taxTotal = invoice.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0) * (Number(item.tax || 0) / 100),
      0,
    )
    const discount = invoice.taxMode === 'simple' ? subtotal * (Number(invoice.discount || 0) / 100) : 0
    return { subtotal, taxTotal, discount, total: subtotal + taxTotal - discount }
  }, [invoice.items, invoice.discount, invoice.taxMode])

  const addItem = () => {
    setStorageError('')
    setInvoice((current) => ({
      ...current,
      items: [...current.items, { id: Date.now(), description: '', detail: '', quantity: 1, rate: 0, tax: 18 }],
    }))
  }

  const removeItem = (id) => {
    setStorageError('')
    setInvoice((current) => ({
      ...current,
      items: current.items.length > 1 ? current.items.filter((item) => item.id !== id) : current.items,
    }))
  }

  const handleImage = (key) => (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStorageError('Please choose a valid image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setStorageError('Please use an image smaller than 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => update(key, String(reader.result))
    reader.onerror = () => setStorageError('The selected image could not be read.')
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const reset = () => setResetDialogOpen(true)

  const confirmReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Unable to clear the saved invoice.', error)
      setStorageError('Could not clear the saved invoice from this browser.')
      setResetDialogOpen(false)
      return
    }
    setStorageError('')
    setInvoice(initialInvoice)
    setResetDialogOpen(false)
  }

  const updateDiscount = (value) => update('discount', value === '' ? '' : Math.max(0, Math.min(100, Number(value) || 0)))
  const formatDate = (date) =>
    date
      ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—'
  const qrValue = invoice.upiId
    ? `upi://pay?pa=${encodeURIComponent(invoice.upiId)}&pn=${encodeURIComponent(invoice.businessName)}${invoice.currency === '₹' ? `&am=${totals.total.toFixed(2)}&cu=INR` : ''}&tn=${encodeURIComponent(invoice.invoiceNumber)}`
    : ''
  const paymentStatus = invoice.paymentStatus === 'paid'
    ? 'paid'
    : invoice.dueDate && invoice.dueDate < today
      ? 'overdue'
      : 'due'

  return (
    <ThemeProvider theme={muiTheme}>
      <div className={`app-shell ${invoice.theme === 'dark' ? 'dark-theme' : ''}`} style={{ '--accent': invoice.accent }}>
        <header className="topbar">
          <a className="brand" href="#" aria-label="Invoice Studio home">
            <span className="brand-mark"><FileText size={19} strokeWidth={2.2} /></span>
            <span>Invoice<span className="brand-dot">.</span>Studio</span>
          </a>
          {/* <div className="topbar-center"><span className="workspace-dot" /> Workspace <ChevronDown size={14} /></div> */}
          <div className="topbar-actions">
            <span className={`save-status ${storageError ? 'failed' : ''}`}>{storageError ? <CircleHelp size={14} /> : <Check size={14} />}{storageError ? 'Not saved' : 'Saved automatically'}</span>
            <Tooltip title={`Switch to ${invoice.theme === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton className="theme-toggle" onClick={() => update('theme', invoice.theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
                {invoice.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </IconButton>
            </Tooltip>
            <Button className="download-top" variant="contained" startIcon={<ArrowDownToLine size={17} />} onClick={() => window.print()}>
              Download PDF
            </Button>
          </div>
        </header>

        <main className="workspace">
          <div className="page-heading">
            <div>
              {/* <div className="eyebrow">YOUR WORKSPACE <span>/</span> INVOICES</div> */}
              <h1>Create an invoice<span>.</span></h1>
              <p>Make it yours, then send it on its way.</p>
            </div>
            <Button className="reset-button" variant="text" startIcon={<RotateCcw size={15} />} onClick={reset}>Start over</Button>
          </div>

          <div className="mobile-tabs">
            <button className={mobileView === 'editor' ? 'active' : ''} onClick={() => setMobileView('editor')}>Edit details</button>
            <button className={mobileView === 'preview' ? 'active' : ''} onClick={() => setMobileView('preview')}>Live preview</button>
          </div>

          {storageError && <Alert severity="warning" className="storage-alert" onClose={() => setStorageError('')}>{storageError}</Alert>}

          <div className={`builder-grid ${mobileView === 'preview' ? 'show-preview' : ''}`}>
            <section className="editor-column">
              <Paper className="editor-card" elevation={0}>
                <div className="editor-intro">
                  <div>
                    <span className="mini-label">INVOICE SETUP</span>
                    <h2>Invoice details</h2>
                  </div>
                  <Tooltip title="Your invoice is saved only in this browser"><IconButton size="small" aria-label="About local saving"><CircleHelp size={17} /></IconButton></Tooltip>
                </div>

                <div className="setup-row">
                  <div className="setup-label">Template</div>
                  <div className="template-picker">
                    {['Modern', 'Classic', 'Minimal'].map((template) => (
                      <button key={template} className={invoice.template === template ? 'selected' : ''} onClick={() => update('template', template)}>
                        <span className={`template-glyph ${template.toLowerCase()}`}><i /><i /><i /></span>{template}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="setup-row color-row">
                  <div className="setup-label">Accent color</div>
                  <div className="color-options">
                    {['#6757e8', '#258b70', '#e47b54', '#3278c4', '#292e38'].map((color) => (
                      <button key={color} className={`color-dot ${invoice.accent === color ? 'chosen' : ''}`} style={{ '--swatch': color }} onClick={() => update('accent', color)} aria-label={`Set accent color ${color}`} />
                    ))}
                    <label className="custom-color" title="Choose custom color"><input type="color" value={invoice.accent} onChange={(event) => update('accent', event.target.value)} /><Plus size={14} /></label>
                  </div>
                </div>

                <div className="form-section">
                  <SectionTitle number="01" title="Your business" />
                  <div className="upload-row">
                    <div className="logo-preview">{invoice.logo ? <img src={invoice.logo} alt="Business logo" /> : <ImagePlus size={19} />}</div>
                    <div className="upload-copy"><b>Business logo</b><span>PNG or JPG, up to 2 MB</span></div>
                    <Button component="label" size="small" className="upload-button" startIcon={<Upload size={14} />}>
                      Upload<input hidden type="file" accept="image/*" onChange={handleImage('logo')} />
                    </Button>
                  </div>
                  <div className="field-grid">
                    <Field label="Business name" value={invoice.businessName} onChange={(event) => update('businessName', event.target.value)} />
                    <Field label="GSTIN / Tax ID" value={invoice.taxId} onChange={(event) => update('taxId', event.target.value)} />
                    <Field className="wide-field" label="Business address" multiline minRows={2} value={invoice.businessAddress} onChange={(event) => update('businessAddress', event.target.value)} />
                    <Field label="Email address" type="email" value={invoice.businessEmail} onChange={(event) => update('businessEmail', event.target.value)} />
                    <Field label="Phone number" value={invoice.businessPhone} onChange={(event) => update('businessPhone', event.target.value)} />
                  </div>
                </div>

                <div className="form-section">
                  <SectionTitle number="02" title="Client & dates" />
                  <div className="field-grid">
                    <Field label="Client name" value={invoice.clientName} onChange={(event) => update('clientName', event.target.value)} />
                    <Field label="Client email" type="email" value={invoice.clientEmail} onChange={(event) => update('clientEmail', event.target.value)} />
                    <Field className="wide-field" label="Client address" multiline minRows={2} value={invoice.clientAddress} onChange={(event) => update('clientAddress', event.target.value)} />
                    <Field label="Invoice number" value={invoice.invoiceNumber} onChange={(event) => update('invoiceNumber', event.target.value)} />
                    <div className="date-field"><Field label="Invoice date" type="date" InputLabelProps={{ shrink: true }} value={invoice.invoiceDate} onChange={(event) => update('invoiceDate', event.target.value)} /></div>
                    <div className="date-field"><Field label="Due date" type="date" InputLabelProps={{ shrink: true }} value={invoice.dueDate} onChange={(event) => update('dueDate', event.target.value)} /></div>
                    <div className="select-field status-select">
                      <label htmlFor="payment-status">Payment status</label>
                      <Select id="payment-status" value={invoice.paymentStatus || 'due'} onChange={(event) => update('paymentStatus', event.target.value)} size="small" fullWidth>
                        <MenuItem value="due">Unpaid</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="form-section items-section">
                  <SectionTitle
                    number="03"
                    title="Line items"
                    action={<Button className="add-item-button" size="small" startIcon={<Plus size={15} />} onClick={addItem}>Add item</Button>}
                  />
                  <div className="item-editor-head"><span>DESCRIPTION</span><span>QTY</span><span>RATE</span><span>TAX</span><span /></div>
                  <div className="item-editors">
                    {invoice.items.map((item) => (
                      <div className="item-editor" key={item.id}>
                        <div className="item-description">
                          <TextField variant="outlined" size="small" placeholder="Item or service" value={item.description} onChange={(event) => updateItem(item.id, 'description', event.target.value)} />
                          <input placeholder="Add a short description" value={item.detail} onChange={(event) => updateItem(item.id, 'detail', event.target.value)} aria-label="Item details" />
                        </div>
                        <TextField variant="outlined" size="small" type="number" inputProps={{ min: 0 }} value={item.quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} aria-label="Quantity" />
                        <TextField variant="outlined" size="small" type="number" inputProps={{ min: 0 }} value={item.rate} onChange={(event) => updateItem(item.id, 'rate', event.target.value)} aria-label="Rate" />
                        <TextField variant="outlined" size="small" type="number" inputProps={{ min: 0, max: 100 }} value={item.tax} onChange={(event) => updateItem(item.id, 'tax', event.target.value)} aria-label="Tax percent" />
                        <IconButton className="delete-item" size="small" onClick={() => removeItem(item.id)} aria-label="Remove item"><Trash2 size={15} /></IconButton>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-section tax-section">
                  <SectionTitle number="04" title="Tax & payment" />
                  <div className="mode-toggle">
                    <button className={invoice.taxMode === 'simple' ? 'active' : ''} onClick={() => update('taxMode', 'simple')}>Simple tax</button>
                    <button className={invoice.taxMode === 'gst' ? 'active' : ''} onClick={() => update('taxMode', 'gst')}>GST mode</button>
                  </div>
                  {invoice.taxMode === 'gst' ? (
                    <div className="gst-switch">
                      <div><b>Interstate supply</b><span>Use IGST instead of CGST + SGST</span></div>
                      <Switch size="small" checked={invoice.interstate} onChange={(event) => update('interstate', event.target.checked)} inputProps={{ 'aria-label': 'Interstate supply' }} />
                    </div>
                  ) : (
                    <Field label="Discount (%)" type="number" inputProps={{ min: 0, max: 100 }} value={invoice.discount} onChange={(event) => updateDiscount(event.target.value)} />
                  )}
                  <div className="field-grid payment-fields">
                    <Field label="UPI ID" placeholder="name@bank" value={invoice.upiId} onChange={(event) => update('upiId', event.target.value)} />
                    <div className="select-field">
                      <label htmlFor="currency-select">Currency</label>
                      <Select id="currency-select" value={invoice.currency} onChange={(event) => update('currency', event.target.value)} size="small" fullWidth>
                        {['₹', '$', '€', '£'].map((currency) => <MenuItem value={currency} key={currency}>{currency} {currency === '₹' ? 'INR' : currency === '$' ? 'USD' : currency === '€' ? 'EUR' : 'GBP'}</MenuItem>)}
                      </Select>
                    </div>
                    <Field label="Bank name" value={invoice.bankName} onChange={(event) => update('bankName', event.target.value)} />
                    <Field label="Account holder" value={invoice.accountName} onChange={(event) => update('accountName', event.target.value)} />
                    <Field label="Account number" value={invoice.accountNumber} onChange={(event) => update('accountNumber', event.target.value)} />
                    <Field label="IFSC code" value={invoice.ifsc} onChange={(event) => update('ifsc', event.target.value)} />
                  </div>
                </div>

                <div className="form-section last-section">
                  <SectionTitle number="05" title="Notes & signature" />
                  <div className="field-grid">
                    <Field className="wide-field" label="Note to your client" multiline minRows={2} value={invoice.notes} onChange={(event) => update('notes', event.target.value)} />
                    <Field className="wide-field" label="Payment terms" multiline minRows={2} value={invoice.terms} onChange={(event) => update('terms', event.target.value)} />
                    <Field label="Authorized signatory" value={invoice.signatory} onChange={(event) => update('signatory', event.target.value)} />
                    <div className="signature-upload">
                      <span>Signature image</span>
                      <Button component="label" size="small" startIcon={<Upload size={14} />}>{invoice.signature ? 'Change image' : 'Upload image'}<input hidden type="file" accept="image/*" onChange={handleImage('signature')} /></Button>
                    </div>
                  </div>
                </div>
              </Paper>
              <div className="editor-footnote"><span className="privacy-dot" /> Your data stays on this device. Nothing is sent to a server.</div>
            </section>

            <section className="preview-column">
              <div className="preview-toolbar">
                <div className="preview-label"><span className="live-dot" /> LIVE PREVIEW <span className="a4-label">A4 · PORTRAIT</span></div>
                <Button className="preview-download" variant="contained" startIcon={<ArrowDownToLine size={16} />} onClick={() => window.print()}>Download PDF</Button>
              </div>

              <Paper className={`invoice-paper template-${invoice.template.toLowerCase()}`} elevation={0}>
                <div className="invoice-topline" />
                <div className="invoice-header">
                  <div className="invoice-business">
                    {invoice.logo ? <img className="invoice-logo" src={invoice.logo} alt="" /> : <div className="invoice-logo-placeholder">{(invoice.businessName || 'P').slice(0, 1).toUpperCase()}</div>}
                    <div><h2>{invoice.businessName || 'Your business'}</h2><p>{invoice.businessAddress || 'Your business address'}</p>
                      <p>{[invoice.businessEmail, invoice.businessPhone].filter(Boolean).join('  ·  ')}</p>
                      {invoice.taxId && <p className="tax-id">GSTIN <b>{invoice.taxId}</b></p>}
                    </div>
                  </div>
                  <div className="invoice-heading"><span>INVOICE</span><strong>{invoice.invoiceNumber || 'INV-001'}</strong></div>
                </div>

                <div className="invoice-meta">
                  <div><span>ISSUED ON</span><b>{formatDate(invoice.invoiceDate)}</b></div>
                  <div><span>DUE DATE</span><b>{formatDate(invoice.dueDate)}</b></div>
                  <div className={`due-chip status-${paymentStatus}`}>
                    {paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'overdue' ? 'Overdue' : 'Payment due'}
                  </div>
                </div>

                <div className="bill-to-grid">
                  <div className="bill-card from-card"><span className="paper-label">BILLED BY</span><h3>{invoice.businessName || 'Your business'}</h3><p>{invoice.businessAddress || 'Business address'}</p><p>{invoice.businessEmail}</p></div>
                  <div className="bill-card"><span className="paper-label">BILLED TO</span><h3>{invoice.clientName || 'Client name'}</h3><p>{invoice.clientAddress || 'Client address'}</p><p>{invoice.clientEmail}</p></div>
                </div>

                <table className="invoice-table">
                  <thead><tr><th>ITEM DESCRIPTION</th><th>QTY</th><th>RATE</th><th>AMOUNT</th></tr></thead>
                  <tbody>
                    {invoice.items.map((item) => {
                      const lineTotal = Number(item.quantity || 0) * Number(item.rate || 0)
                      return <tr key={item.id}><td><b>{item.description || 'New item'}</b>{item.detail && <small>{item.detail}</small>}</td><td>{item.quantity || 0}</td><td>{money(item.rate, invoice.currency)}</td><td className="amount-cell">{money(lineTotal, invoice.currency)}</td></tr>
                    })}
                  </tbody>
                </table>

                <div className="invoice-bottom">
                  <div className="payment-block">
                    {qrValue && paymentStatus !== 'paid' && <div className="qr-box"><QRCodeSVG value={qrValue} size={86} level="M" includeMargin /><span>SCAN TO PAY</span></div>}
                    <div className="payment-info">
                      <span className="paper-label">PAYMENT DETAILS</span>
                      {invoice.upiId && <p><b>UPI ID</b> {invoice.upiId}</p>}
                      {invoice.bankName && <p><b>BANK</b> {invoice.bankName}</p>}
                      {invoice.accountNumber && <p><b>A/C NO.</b> {invoice.accountNumber}</p>}
                      {invoice.ifsc && <p><b>IFSC</b> {invoice.ifsc}</p>}
                    </div>
                  </div>
                  <div className="totals-block">
                    <div className="total-row"><span>Subtotal</span><b>{money(totals.subtotal, invoice.currency)}</b></div>
                    {invoice.taxMode === 'gst' ? (
                      invoice.interstate
                        ? <div className="total-row"><span>IGST</span><b>{money(totals.taxTotal, invoice.currency)}</b></div>
                        : <><div className="total-row"><span>CGST</span><b>{money(totals.taxTotal / 2, invoice.currency)}</b></div><div className="total-row"><span>SGST</span><b>{money(totals.taxTotal / 2, invoice.currency)}</b></div></>
                    ) : (
                      <><div className="total-row"><span>Tax</span><b>{money(totals.taxTotal, invoice.currency)}</b></div>{totals.discount > 0 && <div className="total-row discount-row"><span>Discount ({invoice.discount}%)</span><b>−{money(totals.discount, invoice.currency)}</b></div>}</>
                    )}
                    <div className="grand-total"><span>{paymentStatus === 'paid' ? 'Total paid' : paymentStatus === 'overdue' ? 'Total overdue' : 'Total due'}</span><b>{money(totals.total, invoice.currency)}</b></div>
                  </div>
                </div>

                <div className="invoice-footer">
                  <div className="invoice-notes"><span className="paper-label">NOTES</span><p>{invoice.notes}</p><small>{invoice.terms}</small></div>
                  <div className="signature-block">
                    {invoice.signature && <img src={invoice.signature} alt="" />}
                    <span className="signature-rule" />
                    <b>{invoice.signatory || 'Authorized signatory'}</b><small>AUTHORIZED SIGNATORY</small>
                  </div>
                </div>
                <div className="paper-endnote"><span>THANK YOU FOR YOUR BUSINESS</span><span>{invoice.invoiceNumber}</span></div>
              </Paper>
              <div className="preview-hint"><ArrowLeftRight size={14} /> Every change updates your invoice instantly</div>
            </section>
          </div>
        </main>
        <footer className="bottom-bar"><span>Made for the business you’re building.</span><span>Developed by <span className="footer-dot">·</span> Chandan Raj</span></footer>
      </div>
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
        className="reset-dialog"
      >
        <DialogTitle id="reset-dialog-title" className="reset-dialog-title">
          <span className="reset-dialog-icon"><AlertTriangle size={22} /></span>
          <span>Start fresh?</span>
          <IconButton aria-label="Close dialog" onClick={() => setResetDialogOpen(false)} className="reset-dialog-close">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent id="reset-dialog-description" className="reset-dialog-content">
          This will replace all invoice details, including your saved business and payment information, with the starter example.
        </DialogContent>
        <DialogActions className="reset-dialog-actions">
          <Button onClick={() => setResetDialogOpen(false)} className="reset-cancel-button">Keep editing</Button>
          <Button onClick={confirmReset} variant="contained" startIcon={<Trash2 size={16} />} className="reset-confirm-button">
            Reset invoice
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  )
}

export default App

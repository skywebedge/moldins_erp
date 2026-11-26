'use client';

import React, { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import FormField from '../../components/ui/FormField';
import AutoField from '../../components/ui/AutoField';
import SearchSelect, { SelectOption } from '../../components/ui/SearchSelect';
import PhotoCapture, { PhotoCaptureData } from '../../components/ui/PhotoCapture';
import DataTable, { Column } from '../../components/ui/DataTable';
import KpiCard from '../../components/ui/KpiCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SuccessScreen from '../../components/ui/SuccessScreen';
import { Button } from '../../components/ui/Button';
import {
  PdfViewerModal,
  formatIndianCurrency,
  formatIndianDate,
  formatIndianNumber,
} from '../../components/ui/PdfHelper';
import {
  Boxes,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Sparkles,
  Building2,
  CheckCircle2,
  Fuel,
  Users,
} from 'lucide-react';

export default function ComponentsDemoPage() {
  // 1. Live AUTO calculation state
  const [pieces, setPieces] = useState<number>(1800);
  const [rate, setRate] = useState<number>(36);
  const [grossWeight, setGrossWeight] = useState<number>(9400);
  const [emptyTrolley, setEmptyTrolley] = useState<number>(2900);

  // AUTO values
  const totalAmount = pieces * rate;
  const netWeight = grossWeight - emptyTrolley;

  // 2. SearchSelect state
  const [selectedParty, setSelectedParty] = useState<string>('shree_infra');
  const [parties, setParties] = useState<SelectOption[]>([
    { value: 'shree_infra', labelHi: 'श्री इंफ्रा प्रोजेक्ट्स (Shree Infra)', labelEn: 'Client', badge: 'Client' },
    { value: 'ultratech', labelHi: 'अल्ट्राटेक सीमेंट एजेंसी (UltraTech)', labelEn: 'Supplier', badge: 'Supplier' },
    { value: 'bajrang', labelHi: 'बजरंग स्टोन क्रेशर (Bajrang Crusher)', labelEn: 'Supplier', badge: 'Supplier' },
    { value: 'chhotelal', labelHi: 'छोटेलाल लेबर ठेकेदार (Labour)', labelEn: 'Sub-contractor', badge: 'Labour' },
  ]);
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [newPartyName, setNewPartyName] = useState<string>('');

  // 3. Photo & GPS state
  const [photoInfo, setPhotoInfo] = useState<PhotoCaptureData | null>(null);

  // 4. Modal states
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [successOpen, setSuccessOpen] = useState<boolean>(false);
  const [pdfOpen, setPdfOpen] = useState<boolean>(false);

  // 5. Sample DataTable
  interface SampleRow {
    id: string;
    itemHi: string;
    itemEn: string;
    qty: number;
    unit: string;
    rate: number;
    amount: number;
  }

  const sampleColumns: Column<SampleRow>[] = [
    {
      headerHi: 'सामग्री / आइटम',
      headerEn: 'Material / Product',
      accessorKey: 'itemHi',
      cell: (r) => (
        <div>
          <span className="font-extrabold text-slate-900 block">{r.itemHi}</span>
          <span className="text-xs text-slate-500 font-sans">{r.itemEn}</span>
        </div>
      ),
    },
    {
      headerHi: 'मात्रा (Qty)',
      headerEn: 'Quantity',
      accessorKey: 'qty',
      align: 'right',
      cell: (r) => (
        <span className="font-black text-slate-900 font-mono">
          {formatIndianNumber(r.qty)} {r.unit}
        </span>
      ),
    },
    {
      headerHi: 'दर (Rate)',
      headerEn: 'Rate per unit',
      accessorKey: 'rate',
      align: 'right',
      cell: (r) => <span className="font-bold text-slate-700 font-mono">₹ {r.rate}</span>,
    },
    {
      headerHi: 'कुल रकम (Amount)',
      headerEn: 'Total Amount',
      accessorKey: 'amount',
      align: 'right',
      cell: (r) => (
        <span className="font-black text-blue-900 font-mono bg-blue-50 px-2 py-0.5 rounded">
          {formatIndianCurrency(r.amount)}
        </span>
      ),
      exportValue: (r) => r.amount,
    },
  ];

  const sampleData: SampleRow[] = [
    { id: '1', itemHi: 'टाइल 10" x 10" M30', itemEn: 'Tile 10x10 M30', qty: 1800, unit: 'pcs', rate: 36, amount: 64800 },
    { id: '2', itemHi: 'ओपीसी 53 सीमेंट', itemEn: 'OPC 53 Cement', qty: 3000, unit: 'kg', rate: 7.2, amount: 21600 },
    { id: '3', itemHi: '10mm गिट्टी (एग्रीगेट)', itemEn: '10mm Aggregate', qty: 4500, unit: 'kg', rate: 1.1, amount: 4950 },
    { id: '4', itemHi: 'क्रेशर सैंड', itemEn: 'Crusher Sand', qty: 6000, unit: 'kg', rate: 0.85, amount: 5100 },
    { id: '5', itemHi: 'हार्डनर केमिकल', itemEn: 'Hardener Chemical', qty: 40000, unit: 'gram', rate: 0.08, amount: 3200 },
  ];

  const handleQuickAddParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    const newVal = `party_${Date.now()}`;
    const newOpt: SelectOption = {
      value: newVal,
      labelHi: newPartyName.trim(),
      labelEn: 'Newly Added',
      badge: 'New',
    };
    setParties((prev) => [newOpt, ...prev]);
    setSelectedParty(newVal);
    setNewPartyName('');
    setQuickAddOpen(false);
  };

  return (
    <AppShell
      screenTitleHi="साझा कंपोनेंट्स लाइब्रेरी एवं डेमो"
      screenTitleEn="Low-Literacy Shared UI Components & Interactive Showroom"
      helpStepsHi={[
        'इस पेज पर सभी लो-लिटरेसी यूआई (UI) कंपोनेंट्स को लाइव टेस्ट किया जा सकता है।',
        'मात्रा और दर बदलने पर नीचे पीला AUTO फील्ड तुरंत अपने आप रकम की गणना करता है।',
        'ड्रॉपडाउन में "नया जोड़ें" बटन दबाकर तुरंत नई पार्टी जोड़ी जा सकती है।',
        'कैमरा बटन दबाने पर फोटो के साथ जीपीएस लोकेशन और समय रिकॉर्ड होता है।',
      ]}
    >
      <div className="space-y-10">
        {/* Component 1: KPI Cards Grid */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-700" />
            <h3 className="text-xl font-black text-slate-900">
              1. केपीआई कार्ड्स (KpiCard)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              labelHi="आज का उत्पादन"
              labelEn="Production Today"
              value={formatIndianNumber(1800)}
              unit="pcs"
              subText="टारगेट: 2,000 pcs (90%)"
              icon={<Boxes className="w-6 h-6" />}
              iconBgColor="bg-blue-100 text-blue-700"
              trend={{ value: '12%', isPositive: true }}
            />
            <KpiCard
              labelHi="आज का डिस्पैच"
              labelEn="Dispatch Today"
              value={formatIndianCurrency(67300)}
              subText="चालान #CH-118 (1,800 pcs)"
              icon={<Building2 className="w-6 h-6" />}
              iconBgColor="bg-emerald-100 text-emerald-700"
              trend={{ value: '8%', isPositive: true }}
            />
            <KpiCard
              labelHi="डीजल खपत (साइट)"
              labelEn="Diesel Used Today"
              value="142.5"
              unit="Litre"
              subText="3 मशीनें एवं 2 टिप्पर"
              icon={<Fuel className="w-6 h-6" />}
              iconBgColor="bg-amber-100 text-amber-700"
              trend={{ value: 'Normal', isNeutral: true }}
            />
            <KpiCard
              labelHi="मनी एट रिस्क (रेड फ्लैग)"
              labelEn="Money At Risk (Alerts)"
              value={formatIndianCurrency(14500)}
              subText="2 हाई अलर्ट (रेसिपी अंतर)"
              icon={<AlertTriangle className="w-6 h-6" />}
              iconBgColor="bg-rose-100 text-rose-700"
              alertLevel="DANGER"
              trend={{ value: 'High', isPositive: false }}
            />
          </div>
        </section>

        {/* Component 2 & 3: FormField + AutoField Live Calculation */}
        <section className="bg-surface p-6 rounded border border-border shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                2 & 3. फॉर्म इनपुट (FormField) एवं लाइव गणना (AutoField)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                संख्या बदलते ही AUTO फील्ड बिना पेज रीलोड किए तुरंत लाइव अपडेट होता है
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 py-1 rounded-full">
              LIVE FORMULA
            </span>
          </div>

          {/* Test Grid 1: Pieces x Rate = Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormField
              labelHi="उत्पादन / माल मात्रा (Pieces)"
              labelEn="Quantity / Units"
              type="number"
              required
              value={pieces}
              onChange={(e) => setPieces(parseFloat(e.target.value) || 0)}
              suffixText="pcs"
            />

            <FormField
              labelHi="प्रति नग दर (Rate)"
              labelEn="Rate per piece"
              type="number"
              required
              prefixText="₹"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
            />

            <AutoField
              labelHi="कुल रकम (Total Amount)"
              labelEn="AUTO Calculated Amount"
              value={formatIndianCurrency(totalAmount)}
              formula="= Pieces x Rate"
            />
          </div>

          {/* Test Grid 2: Gross - Empty = Net Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-slate-100">
            <FormField
              labelHi="कांटा सकल वजन (Gross Weight)"
              labelEn="Loaded Vehicle Weight"
              type="number"
              value={grossWeight}
              onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
              suffixText="kg"
            />

            <FormField
              labelHi="खाली गाड़ी वजन (Empty / Tare)"
              labelEn="Empty Trolley Weight"
              type="number"
              value={emptyTrolley}
              onChange={(e) => setEmptyTrolley(parseFloat(e.target.value) || 0)}
              suffixText="kg"
            />

            <AutoField
              labelHi="शुद्ध वजन (Net Weight)"
              labelEn="AUTO Net Payload"
              value={formatIndianNumber(netWeight)}
              suffixText="kg"
              formula="= Gross - Empty"
            />
          </div>
        </section>

        {/* Component 4: SearchSelect with + Naya Jodo */}
        <section className="bg-surface p-6 rounded border border-border shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-xl font-black text-slate-900">
              4. खोजने योग्य ड्रॉपडाउन (SearchSelect) + नया जोड़ें
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              ड्रॉपडाउन में खोजें या 'नया जोड़ें' बटन दबाकर तुरंत नई पार्टी जोड़ें
            </p>
          </div>

          <div className="max-w-md">
            <SearchSelect
              labelHi="पार्टी / सप्लायर चुनें"
              labelEn="Select Party / Supplier"
              required
              options={parties}
              value={selectedParty}
              onChange={(v) => setSelectedParty(v)}
              onQuickAdd={() => setQuickAddOpen(true)}
              quickAddLabel="नई पार्टी जोड़ें"
            />
          </div>
        </section>

        {/* Component 5: PhotoCapture with GPS */}
        <section className="bg-surface p-6 rounded border border-border shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-xl font-black text-slate-900">
              5. कैमरा फोटो एवं जीपीएस ट्रैकिंग (PhotoCapture)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              कैमरा से फोटो खींचने पर अक्षांश (Lat), देशांतर (Long), और सटीक समय दर्ज होता है
            </p>
          </div>

          <div className="max-w-md">
            <PhotoCapture
              labelHi="गाड़ी / चालान फोटो"
              labelEn="Vehicle Weighbridge Photo"
              required
              onPhotoCaptured={(data) => setPhotoInfo(data)}
            />
          </div>
        </section>

        {/* Component 6: DataTable with Excel Export */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">
              6. डेटा टेबल एवं एक्सेल डाउनलोड (DataTable)
            </h3>
          </div>

          <DataTable
            titleHi="आज का डिस्पैच एवं सामग्री रजिस्टर"
            titleEn="Daily Dispatches & Stock Movement Log"
            columns={sampleColumns}
            data={sampleData}
            excelFileName="Moldins_Dispatch_Report"
          />
        </section>

        {/* Component 7, 8 & 9: ConfirmDialog, SuccessScreen, and PDF Helper */}
        <section className="bg-surface p-6 rounded border border-border shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-xl font-black text-slate-900">
              7, 8 & 9. डायलॉग्स, सफलता स्क्रीन (SuccessScreen) एवं प्रिंट/पीडीएफ
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              नीचे दिए गए बटन्स दबाकर प्रत्येक मॉडल को टेस्ट करें
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Trigger 1: Confirm Delete Dialog */}
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="min-h-[48px] px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 font-black rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>पक्का हटाना है? (Delete Dialog)</span>
            </button>

            {/* Trigger 2: Success Screen Modal */}
            <button
              type="button"
              onClick={() => setSuccessOpen(true)}
              className="min-h-[48px] px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 font-black rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>सेव हो गया (Success Screen)</span>
            </button>

            {/* Trigger 3: Printable PDF Modal */}
            <button
              type="button"
              onClick={() => setPdfOpen(true)}
              className="min-h-[48px] px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border-2 border-blue-300 font-black rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
            >
              <FileText className="w-5 h-5 text-blue-600" />
              <span>प्रिंट / चालान PDF प्रिव्यू</span>
            </button>
          </div>
        </section>
      </div>

      {/* MODAL 1: Quick Add Party */}
      {quickAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative bg-surface rounded-lg max-w-md w-full p-6 border border-border shadow-modal space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-text-primary">
                + नई पार्टी / सप्लायर जोड़ें
              </h3>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-text-muted">
              फॉर्म छोड़े बिना तुरंत नई पार्टी का नाम दर्ज करें
            </p>

            <form onSubmit={handleQuickAddParty} className="space-y-4">
              <FormField
                labelHi="पार्टी का नाम"
                labelEn="Party / Supplier Full Name"
                required
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                placeholder="उदा. शिवम इंफ्रा"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setQuickAddOpen(false)}
                >
                  <span>रद्द करें</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                >
                  <span>जोड़ें (Add)</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Soft Delete */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          alert('रिकॉर्ड सफलतापूर्वक हटा दिया गया (Soft Deleted)!');
          setConfirmOpen(false);
        }}
        descriptionHi="क्या आप सच में 'चालान #CH-118' को हटाना चाहते हैं?"
      />

      {/* MODAL 3: Success Screen */}
      <SuccessScreen
        isOpen={successOpen}
        titleHi="सेव हो गया!"
        recordIdentifier="डिलीवरी चालान #CH-118 • ₹ 67,300"
        subtitleHi="माल डिस्पैच सफलतापूर्वक दर्ज हो गया और स्टॉक घट गया है।"
        onNewEntry={() => setSuccessOpen(false)}
        onViewList={() => setSuccessOpen(false)}
      />

      {/* MODAL 4: Printable Challan Preview */}
      <PdfViewerModal
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        title="डिलीवरी चालान प्रिव्यू (Challan #CH-118)"
      >
        <div className="space-y-6 text-slate-900">
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black">MOLDINS INFRA PRECAST PVT LTD</h2>
              <p className="text-xs text-slate-600">Industrial Area Phase 2 • GSTIN: 08AAAAA0000A1Z5</p>
              <p className="text-xs text-slate-600">Phone: 9876543210</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs rounded">
                DELIVERY CHALLAN
              </span>
              <p className="text-sm font-black font-mono mt-1">#CH-118</p>
              <p className="text-xs text-slate-600 font-bold">तारीख: {formatIndianDate(new Date())}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-400 block uppercase">पार्टी / Client</span>
              <span className="font-black text-base text-slate-900 block">Shree Infra Projects Ltd.</span>
              <p className="text-slate-600 mt-0.5">Plot 45, Highway Project, Km 42</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-400 block uppercase">गाड़ी एवं कांटा विवरण</span>
              <span className="font-bold text-slate-900 block">Tractor RJ-14-TA-9988</span>
              <p className="text-slate-600 mt-0.5">सकल: 9,400 kg • खाली: 2,900 kg • शुद्ध: 6,500 kg</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 font-black">
                <th className="py-2">सामग्री</th>
                <th className="py-2 text-right">मात्रा</th>
                <th className="py-2 text-right">दर</th>
                <th className="py-2 text-right">रकम</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              <tr>
                <td className="py-2 font-bold">Tile 10" x 10" Grade M30</td>
                <td className="py-2 text-right font-mono">1,800 pcs</td>
                <td className="py-2 text-right font-mono">₹ 36.00</td>
                <td className="py-2 text-right font-mono font-bold">₹ 64,800.00</td>
              </tr>
              <tr>
                <td className="py-2">Transportation / भाड़ा (Tractor)</td>
                <td className="py-2 text-right font-mono">1 Trip</td>
                <td className="py-2 text-right font-mono">₹ 2,500.00</td>
                <td className="py-2 text-right font-mono font-bold">₹ 2,500.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-black text-sm">
                <td colSpan={3} className="py-3 text-right">कुल देय रकम (Grand Total):</td>
                <td className="py-3 text-right font-mono text-base text-blue-900">₹ 67,300.00</td>
              </tr>
            </tfoot>
          </table>

          <div className="pt-8 flex justify-between items-end text-xs font-bold text-slate-500">
            <div>
              <div className="border-b border-slate-400 w-40 mb-1"></div>
              <span>प्राप्तकर्ता के हस्ताक्षर (Receiver Sign)</span>
            </div>
            <div className="text-right">
              <div className="border-b border-slate-400 w-40 mb-1 ml-auto"></div>
              <span>अधिकृत हस्ताक्षर (Authorized Signatory)</span>
            </div>
          </div>
        </div>
      </PdfViewerModal>
    </AppShell>
  );
}

import ExtractorForm from '@/components/ExtractorForm';

export default function ExtractPage() {
  return (
    <div className="content-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">Extractor</span>
          <h1>Publication data extraction</h1>
          <p>Upload a TXT file, select its source, keep only articles containing email addresses, and download one record per email.</p>
        </div>
      </header>
      <ExtractorForm />
    </div>
  );
}

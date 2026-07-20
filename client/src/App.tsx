import { getErrorMessage } from './api/client';
import { PastRecordsPanel } from './components/PastRecordsPanel/PastRecordsPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { UploadForm } from './components/UploadForm/UploadForm';
import type { UploadFormValues } from './components/UploadForm/UploadForm';
import { useAnalyzeMutation } from './hooks/useAnalyzeMutation';

function App() {
  const mutation = useAnalyzeMutation();

  const handleSubmit = (values: UploadFormValues) => {
    if (!values.file) return;

    const formData = new FormData();
    formData.append('file', values.file);
    if (values.lat) formData.append('lat', values.lat);
    if (values.lon) formData.append('lon', values.lon);

    const parsedMinConf = Number.parseFloat(values.minConf);
    formData.append('min_conf', String(Number.isFinite(parsedMinConf) ? parsedMinConf : 0.25));

    mutation.mutate(formData);
  };

  return (
    <div className="flex min-h-screen justify-center gap-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
      <PastRecordsPanel />
      <div className="mt-10 flex gap-0">
        <div className="w-full max-w-[700px] rounded-2xl bg-white p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <header className="mb-10 text-center">
            <h1 className="mb-2.5 text-4xl text-gray-800">BirdNet Analyzer</h1>
            <p className="text-lg text-gray-500">Verein für Vogelschutz und Landschaftspflege Bad Vilbel e.V.</p>
          </header>

          <UploadForm loading={mutation.isPending} onSubmit={handleSubmit} onFileSelected={() => mutation.reset()} />

          {mutation.isError && (
            <div className="mb-5 rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-700">
              <strong>Error:</strong> {getErrorMessage(mutation.error)}
            </div>
          )}

          {mutation.isSuccess && <ResultsPanel results={mutation.data} />}
        </div>
      </div>
    </div>
  );
}

export default App;

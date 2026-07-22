import { getErrorMessage } from '../api/client';
import { ResultsPanel } from '../components/ResultsPanel';
import { UploadForm } from '../components/UploadForm/UploadForm';
import type { UploadFormValues } from '../components/UploadForm/UploadForm';
import { useAnalyzeMutation } from '../hooks/useAnalyzeMutation';

export function HomePage() {
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Analyze a recording</h1>
          <p className="mt-1 text-sm text-slate-500">
            Verein für Vogelschutz und Landschaftspflege Bad Vilbel e.V.
          </p>
        </header>

        <UploadForm loading={mutation.isPending} onSubmit={handleSubmit} onFileSelected={() => mutation.reset()} />

        {mutation.isError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong className="font-semibold">Error:</strong> {getErrorMessage(mutation.error)}
          </div>
        )}

        {mutation.isSuccess && <ResultsPanel results={mutation.data} />}
      </section>
    </div>
  );
}

export default HomePage;

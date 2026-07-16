export default function CookiePolicy() {
  return (
    <div className="bg-white dark:bg-zinc-950 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-6">Cookie Policy</h1>
        <p className="mb-4">
          This is the Cookie Policy for IndiWebPros, accessible from indiwebpros.com.
        </p>
        <p className="mb-4">
          As is common practice with almost all professional websites, this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience.
        </p>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-8 mb-4">How We Use Cookies</h2>
        <p className="mb-4">
          We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.
        </p>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-8 mb-4">The Cookies We Set</h2>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li>Account login related cookies to verify authorization tokens and sessions.</li>
          <li>User preference parameters (e.g. Dark Mode state settings) to save UI choices.</li>
        </ul>
        <p>
          You can prevent the setting of cookies by adjusting the settings on your browser. Be aware that disabling cookies will affect the functionality of this and many other websites that you visit.
        </p>
      </div>
    </div>
  );
}

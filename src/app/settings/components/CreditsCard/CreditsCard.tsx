const LINK_CLASSES = 'text-blue-600 dark:text-blue-400 hover:underline'

export const CreditsCard = () => (
  <section className="bg-background rounded-lg p-6 shadow-sm border border-border">
    <h2 className="text-lg font-semibold mb-4">Voice Credits</h2>
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <p>
        Bundled voice references derived from the Hi-Fi Multi-Speaker English TTS Dataset
        (Bakhturina et al., 2021), available at{' '}
        <a
          href="http://openslr.org/109/"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASSES}
        >
          openslr.org/109
        </a>
        . Licensed under{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASSES}
        >
          CC BY 4.0
        </a>
        . Audio clips were trimmed and processed for use as TTS voice references.
      </p>
      <p>
        <a
          href="https://keithito.com/LJ-Speech-Dataset/"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASSES}
        >
          LJ Speech Dataset
        </a>{' '}
        by Keith Ito.
      </p>
    </div>
  </section>
)

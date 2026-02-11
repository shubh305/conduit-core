import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { DictionaryEntry } from "./dictionary.interfaces";

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);
  private readonly serviceUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.serviceUrl = this.configService.get<string>("DICTIONARY_SERVICE_URL");
    this.apiKey = this.configService.get<string>("SHARED_API_KEY");
  }

  async lookup(word: string, reading?: string): Promise<DictionaryEntry[]> {
    const url = `${this.serviceUrl}/v1/lookup`;

    try {
      this.logger.debug(`Looking up word '${word}' at ${url}`);
      const { data } = await firstValueFrom(
        this.httpService
          .post<DictionaryEntry | DictionaryEntry[]>(
            url,
            { word, reading },
            {
              headers: {
                "Content-Type": "application/json",
                "X-API-KEY": this.apiKey,
              },
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              const errorData = error.response?.data;
              this.logger.error(`Dictionary API Error: ${JSON.stringify(errorData || error.message)}`);

              if (error.response?.status === 404) {
                throw new NotFoundException(`Word '${word}' not found in lexicon`);
              }
              throw new ServiceUnavailableException("Dictionary service currently unavailable");
            }),
          ),
      );

      const entries = Array.isArray(data) ? data : [data];

      // Smart Suggestion Validation:
      if (entries.length > 0 && entries[0].metadata?.is_correct === false) {
        const metadata = entries[0].metadata as { suggestions?: string[] };
        if (metadata.suggestions && metadata.suggestions.length > 0) {
          this.logger.debug(`Validating ${metadata.suggestions.length} suggestions for '${word}'`);
          const validationResults = await Promise.all(metadata.suggestions.map(s => this.checkWordExists(s)));
          const validSuggestions = metadata.suggestions.filter((_, index) => validationResults[index]);
          this.logger.debug(
            `Filtered suggestions for '${word}': ${metadata.suggestions.length} -> ${validSuggestions.length}`,
          );
          metadata.suggestions = validSuggestions;
        }
      }

      let refinedEntries = entries;
      if (reading) {
        const lowerReading = reading.toLowerCase().trim();
        const readingMatches = entries.filter(entry => {
          const mainPhonetic = entry.phonetic?.toLowerCase().trim();
          const altPhonetics = entry.phonetics?.some(p => p.text?.toLowerCase().trim() === lowerReading);
          return mainPhonetic === lowerReading || altPhonetics;
        });

        if (readingMatches.length > 0) {
          refinedEntries = readingMatches;
          this.logger.debug(
            `Filtered ${entries.length} entries down to ${refinedEntries.length} based on reading '${reading}'`,
          );
        }
      }

      this.logger.debug(`Successfully retrieved ${refinedEntries.length} entries for '${word}'`);

      return refinedEntries.map(entry => ({
        ...entry,
        phonetics: entry.phonetics || [],
        meanings: entry.meanings || [],
      }));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Unexpected error looking up word '${word}': ${error.message}`);
      throw new ServiceUnavailableException("Dictionary service processing error");
    }
  }

  /**
   * Quick check to see if a word actually exists in the lexicon with definitions.
   * Used to filter out ghost suggestions.
   */
  private async checkWordExists(word: string): Promise<boolean> {
    const url = `${this.serviceUrl}/v1/lookup`;
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<DictionaryEntry | DictionaryEntry[]>(
          url,
          { word },
          {
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": this.apiKey,
            },
            timeout: 2000,
          },
        ),
      );

      const entries = Array.isArray(data) ? data : [data];
      return entries.some(e => e.metadata?.is_correct !== false && e.meanings && e.meanings.length > 0);
    } catch {
      return false;
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OpenAIService {
  constructor(private http: HttpClient) {}

  async responseJson(prompt: string): Promise<any> {
    const { text } = await firstValueFrom(
      this.http.post<{ text: string }>('http://127.0.0.1:8888/api/openai', { prompt }),
    );
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
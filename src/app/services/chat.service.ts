import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ChatResponse {
  reply: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private http: HttpClient) {}

  sendMessage(message: string) {
    return this.http.post<ChatResponse>(`${environment.apiUrl}/chat`, {
      message: message,
    });
  }
}

import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ChatService } from '../../services/chat.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  time: Date;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule, DatePipe],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements AfterViewChecked {
  private readonly chatService = inject(ChatService);

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  /** Two-way bound to the composer input. */
  userMessage = '';

  /** Conversation history rendered in the message list. */
  readonly messages = signal<ChatMessage[]>([]);

  /** True while the assistant is "typing" a reply. */
  readonly isTyping = signal(false);

  private shouldScroll = false;

  sendMessage(): void {
    const text = this.userMessage.trim();
    if (!text || this.isTyping()) {
      return;
    }

    this.pushMessage({ role: 'user', text, time: new Date() });
    this.userMessage = '';

    this.isTyping.set(true);
    this.chatService.sendMessage(text).subscribe({
      next: (response) => {
        this.pushMessage({
          role: 'assistant',
          text: response.reply,
          time: new Date(),
        });
        this.isTyping.set(false);
      },
      error: (err) => {
        const upstream = err?.error?.upstreamMessage || err?.error?.error || err?.message || 'Unknown error';
        const status = err?.error?.upstreamStatus ?? err?.status ?? '?';
        this.pushMessage({
          role: 'assistant',
          text: `Backend error (${status}): ${upstream}`,
          time: new Date(),
        });
        console.error('Chat request failed:', err);
        this.isTyping.set(false);
      },
    });
  }

  clearChat(): void {
    this.messages.set([]);
  }

  /** Send on Enter, allow Shift+Enter for newlines. */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  private pushMessage(message: ChatMessage): void {
    this.messages.update((list) => [...list, message]);
    this.shouldScroll = true;
  }
}

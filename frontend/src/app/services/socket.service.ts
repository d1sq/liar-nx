import { Injectable, signal } from '@angular/core';
import { Manager } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: ReturnType<typeof Manager.prototype.socket>;
  private sessionId = signal<string | null>(null);
  private isConnected = signal<boolean>(false);
  
  constructor() {
    const options = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      autoConnect: false,
      path: '/socket.io'
    };
    
    const manager = new Manager(environment.wsUrl, options);
    this.socket = manager.socket('/');
    
    // Восстанавливаем sessionId из localStorage при инициализации
    const savedSessionId = localStorage.getItem('sessionId');
    if (savedSessionId) {
      this.sessionId.set(savedSessionId);
    }
    
    // Обработка событий подключения
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected.set(true);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected.set(false);
    });
    
    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.isConnected.set(false);
    });
    
    // Пробуем подключиться
    this.socket.connect();
  }
  
  // Подписка на события
  on<T>(event: string, callback: (data: T) => void) {
    this.socket.on(event, callback);
  }
  
  // Отправка событий с Promise для ответа
  emit<T>(event: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('Socket is not connected'));
        return;
      }
      
      this.socket.emit(event, data, (response: T | { error: string }) => {
        if (response && typeof response === 'object' && 'error' in response) {
          reject(new Error(response.error));
        } else {
          resolve(response as T);
        }
      });
    });
  }
  
  // Сохранение sessionId
  saveSessionId(id: string) {
    this.sessionId.set(id);
    localStorage.setItem('sessionId', id);
  }
  
  // Получение текущего sessionId
  getSessionId() {
    return this.sessionId.asReadonly();
  }
  
  // Получение статуса подключения
  getIsConnected() {
    return this.isConnected.asReadonly();
  }
  
  // Очистка sessionId
  clearSessionId() {
    this.sessionId.set(null);
    localStorage.removeItem('sessionId');
  }
  
  // Отключение от сервера
  disconnect() {
    this.socket.disconnect();
  }
} 
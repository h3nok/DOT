import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp?: string;
  message?: string;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
}

export class BaseApiService {
  protected baseURL: string;
  
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for adding auth headers, etc.
    axios.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add timestamp for cache busting if needed
        if (config.params?.bustCache) {
          config.params._t = Date.now();
          delete config.params.bustCache;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling common errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  protected async makeRequest<T>(
    config: ApiRequestConfig,
    retries: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await axios({
        ...config,
        baseURL: this.baseURL,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'API request failed');
      }

      return response.data;
    } catch (error) {
      // Retry logic for network failures
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(config.retryDelay || 1000);
        return this.makeRequest(config, retries - 1);
      }

      throw this.handleError(error);
    }
  }

  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'GET',
      url: endpoint,
      params,
      ...options,
    }, options?.retries || 0);
  }

  protected async post<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'POST',
      url: endpoint,
      data,
      ...options,
    }, options?.retries || 0);
  }

  protected async put<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PUT',
      url: endpoint,
      data,
      ...options,
    }, options?.retries || 0);
  }

  protected async delete<T>(
    endpoint: string,
    options?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'DELETE',
      url: endpoint,
      ...options,
    }, options?.retries || 0);
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any): Error {
    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unknown error occurred');
  }

  // Health check for any service
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get<{ status: string }>('/health');
      return response.success && response.data.status === 'healthy';
    } catch (error) {
      console.error('Service health check failed:', error);
      return false;
    }
  }
}

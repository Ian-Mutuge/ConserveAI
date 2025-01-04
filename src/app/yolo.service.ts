import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class YoloService {
  private apiUrl = 'http://localhost:5000/video_feed';  // Adjust to your API endpoint


  constructor(private http: HttpClient) {}

  // Method to send frame data for detection
  detectObjects(frameData: string): Observable<any> {
    // Send the frame data as a POST request to your backend API
    return this.http.post<any>(this.apiUrl, { image: frameData });
  }

}


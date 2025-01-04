import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SoundDetectorService {

  private apiUrl = 'http://localhost:5000/sound-detection';  // URL to your Flask API endpoint

  constructor(private http: HttpClient) { }

  // Method to send the audio data (in binary) to the server
  sendAudioData(audioBlob: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');  // You can name the file

    return this.http.post(this.apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error sending audio data:', error);
        return throwError(error);  // Throw error for further handling
      })
    );
  }

  // Method to capture microphone audio and process it
  startRecording(stream: MediaStream): void {
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      this.sendAudioData(audioBlob).subscribe(
        (response) => {
          console.log('Audio classification result:', response);
        },
        (error) => {
          console.error('Error processing audio:', error);
        }
      );
    };

    mediaRecorder.start();
  }

  // Method to initialize microphone capture
  captureMicrophone(): void {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        console.log('Microphone access granted');
        this.startRecording(stream);
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  }
}

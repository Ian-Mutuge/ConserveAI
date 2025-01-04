import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common'; // Import CommonModule for pipes like 'number'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule], // Import CommonModule here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  detectionMetadata: any[] = [];
  audioInferenceResult: { class: string; confidence: number } | null = null;
  isBrowser: boolean;
  pollingInterval: any;
  metadataUrl: string = 'http://127.0.0.1:5000/detection_results';
  audioInferenceUrl: string = 'http://127.0.0.1:5000/live_audio_inference';
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.startPollingMetadata();
    }
  }

  // Polling for metadata
  startPollingMetadata(): void {
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(this.metadataUrl);
        const metadata = await response.json();
        this.detectionMetadata = metadata;
      } catch (error) {
        console.error('Error fetching detection metadata:', error);
      }
    }, 1000);
  }

  // Start live audio recording and inference
  startAudioInference(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Microphone access not supported by the browser.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.sendAudioToServer(audioBlob);
        };

        this.mediaRecorder.start();
        console.log('Recording started...');
        setTimeout(() => this.stopAudioInference(), 5000); // Stop after 5 seconds
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  }

  // Stop the audio recording
  stopAudioInference(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      console.log('Recording stopped.');
    }
  }

  // Send recorded audio to the server
  async sendAudioToServer(audioBlob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');

    try {
      const response = await fetch(this.audioInferenceUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        this.audioInferenceResult = result;
        console.log('Audio Inference Result:', result);
      } else {
        console.error('Failed to get audio inference result:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending audio data to server:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
}

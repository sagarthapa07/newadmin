import { Component } from '@angular/core';
import { Header } from "../../shared/component/header/header";

@Component({
  selector: 'app-preview',
  imports: [Header],
  templateUrl: './preview.html',
  styleUrl: './preview.scss',
})
export class Preview {

  // data = this.opportunityForm.value;
 data = {
    title: 'AI Test 4',
    postDate: 'January 2, 2026',
    donor: 'Ajinomoto Philippines Corporation',
    grantSize: 'Not Available',
    category: 'N/A',
    url: 'Opportunity is not available.',

    description: [
      'This scholarship offers full financial support...',
      'The program provides a comprehensive grant...',
      'The primary objectives of the initiative are...',
      'Funding information includes a structured stipend...'
    ],

    focusAreas: [
      'Religion', 'Innovation', 'COVID-19', 'Spirituality'
    ],

    countries: [
      'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso'
    ],

    counties: [
      'Clay County, Arkansas',
      'Baxter County, Arkansas',
      'Calhoun County, Arkansas'
    ]
  };
}

import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Console } from 'console';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'btk_callback';

  @ViewChild('UploadFileInput', { static: false })
  uploadFileInput!: ElementRef;
  fileUploadForm!: FormGroup;
  fileInputLabel!: any;
  data: any;
  valid: any;

  status:any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  onFileChange(evt: any) {
    /*Reading data */
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0]; // getting name of first worksheet
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data in json format  */
      this.data = <any>XLSX.utils.sheet_to_json(ws, { header: 0 }); 

      console.log('Data',this.data)

      this.valid = true;

      this.data.forEach((r: any) => {
        if (!this.validatePhoneNumber(r.msisdn)) {
          document.write(
            'Row ' + ((r.__rowNum__) + 1) + ' has an invalid phone number<br>'
          );
          this.valid = false;
        }
        if (!this.isValidDate(r.deposit_date)) {
          document.write(
            'Row ' + ((r.__rowNum__) + 1) + ' has an invalid deposit date<br>'
          );
          this.valid = false;
        }
        if (!this.validateNumber(r.amount)) {
          document.write('Row ' + ((r.__rowNum__) + 1) + ' has an invalid number<br>');
          this.valid = false;
        }
      });

      if (this.valid) {
        this.postData(this.data);
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  validatePhoneNumber(input_str: string) {
    var re = /^\(?(\d{3})\)?[- ]?(\d{5})[- ]?(\d{4})$/;

    return re.test(input_str);
  }
  // Validates that the input string is a valid date
  isValidDate(dateString: any) {
    var date = this.excelDateToJSDate(dateString);
    return moment(date, 'YYYY/MM/DD, h:mm:ss', true).isValid();
  }
  excelDateToJSDate(date: any) {
    return new Date(Math.round((date - 25569) * 86400 * 1000));
  }
  validateNumber(z: any) {
    return /^[0-9]+$/.test(z);
  }

  postData(formData: any) {
    this.http
      .post<any>('https://retries.dev01.int.betika.com/deposit', formData)
      .subscribe(
        (response) => {
          console.log(response);
          if (response.statusCode === 200) {
            // Reset the file input
            this.uploadFileInput.nativeElement.value = '';
            this.fileInputLabel = undefined;

            this.status = 'ok'

            return response;
          } else { 
            this.status = 'failed'
          }
        },
        (error) => {
          console.log(error);
        }
      );
  }
}

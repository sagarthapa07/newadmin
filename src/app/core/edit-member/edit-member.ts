import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Header } from "../../shared/component/header/header";

@Component({
  selector: 'app-edit-member',
  imports: [Header],
  templateUrl: './edit-member.html',
  styleUrl: './edit-member.scss',
})
export class EditMember {

constructor(private route: ActivatedRoute) {}


  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    console.log('Member Id =', id);
  }
}

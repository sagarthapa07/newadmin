import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  GetBeneficiariesResponse,
  GetCitiesResponse,
  GetCountiesResponse,
  GetEntitiesResponse,
  GetFocusAreasResponse,
  GetFocusSubAreasResponse,
  GetInsularResponse,
  GetSelectedCitiesResponse,
  GetSelectedInsularResponse,
  GetSelectedStatesResponse,
  GetSelectedTownshipsResponse,
  GetStatesResponse,
  GetSubEntitiesResponse,
  GetTownshipResponse,
  GrantApiResponse,
  SaveInsularPayload,
  SaveTownshipPayload,
  SaveStatesPayload,
  ApiSuccessResponse,
  SaveCitiesPayload,
  GetSelectedFocusAreasResponse,
  SaveFocusAreasPayload,
  InsertSubEntitiesPayload,
  InsertBeneficiariesPayload,
  GetSelectedSubEntitiesResponse,
  GetSelectedBeneficiariesResponse,
} from '../../datatype';

@Injectable({
  providedIn: 'root',
})
export class Api {
  // BASE URL
  private baseUrl = 'https://ang-dnd.fundsforngospremium.com/api';

  // OTHER APIs
  private uploadUrl =
    'https://2m3attvzvf.execute-api.us-east-1.amazonaws.com/US-Release-Domain-RestAPI-Live-UploadFile';

  private donorUrl = 'https://adminapi.grantsforus.app/api';

  constructor(private http: HttpClient) {}

  // =========================
  // GRANT APIs
  // =========================

  getGrants(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/USGrants/GetUSGrantsGridPaging`, payload);
  }

  getGrantById(id: number): Observable<GrantApiResponse> {
    return this.http.get<GrantApiResponse>(`${this.baseUrl}/USGrants/GetUSGrantsDetail?id=${id}`);
  }

  updateGrant(id: number, payload: any) {
    return this.http.post(`${this.baseUrl}/USGrants/UpdateUSGrants?id=${id}`, payload);
  }

  apiUpload(payload: any) {
    return this.http.post(this.uploadUrl, payload);
  }

  // =========================
  // SEARCH DONORS
  // =========================

  searchDonors(donorType: string, searchText: string): Observable<any> {
    return this.http.get<any>(
      `${this.donorUrl}/USDonors/GetUSDonorsByType?donorType=${donorType}&searchText=${searchText}`,
    );
  }

  // =========================
  // GEO LOCATION APIs
  // =========================

  getTownShips(): Observable<GetTownshipResponse> {
    return this.http.get<GetTownshipResponse>(`${this.baseUrl}/TownShips/GetTownShips`);
  }

  getInsularAreas(): Observable<GetInsularResponse> {
    return this.http.get<GetInsularResponse>(`${this.baseUrl}/InsularAreas/GetInsularAreas`);
  }

  getCities(): Observable<GetCitiesResponse> {
    return this.http.get<GetCitiesResponse>(`${this.baseUrl}/Cities/GetCities`);
  }

  getStates(): Observable<GetStatesResponse> {
    return this.http.get<GetStatesResponse>(`${this.baseUrl}/States/GetUSStates`);
  }

  getSelectedCities(grantId: number): Observable<GetSelectedCitiesResponse> {
    return this.http.get<GetSelectedCitiesResponse>(
      `${this.baseUrl}/USGrantCities/ListCitiesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  getSelectedStates(grantId: number): Observable<GetSelectedStatesResponse> {
    return this.http.get<GetSelectedStatesResponse>(
      `${this.baseUrl}/USGrantStates/ListGeoStatesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  getSelectedTownships(grantId: number): Observable<GetSelectedTownshipsResponse> {
    return this.http.get<GetSelectedTownshipsResponse>(
      `${this.baseUrl}/USGrantTownships/ListTownshipsForSelectedGrant?GrantID=${grantId}`,
    );
  }

  getSelectedInsular(grantId: number): Observable<GetSelectedInsularResponse> {
    return this.http.get<GetSelectedInsularResponse>(
      `${this.baseUrl}/USGrantInsularAreas/ListInsularAreasForSelectedGrant?GrantID=${grantId}`,
    );
  }

  insertGrantCities(payload: SaveCitiesPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${this.baseUrl}/USGrantCities/InsertUSGrantCitiesJSON`,
      payload,
    );
  }

  insertGrantInsular(payload: SaveInsularPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${this.baseUrl}/USGrantInsularAreas/InsertUSGrantInsularAreasJSON`,
      payload,
    );
  }

  insertGrantTownships(payload: SaveTownshipPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${this.baseUrl}/USGrantTownships/InsertUSGrantTownshipsJSON`,
      payload,
    );
  }

  insertGrantStates(payload: SaveStatesPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${this.baseUrl}/USGrantStates/InsertUSGrantGeoStates`,
      payload,
    );
  }

  // =========================
  // FOCUS AREAS APIs
  // =========================

  getFocusAreas(): Observable<GetFocusAreasResponse> {
    return this.http.get<GetFocusAreasResponse>(`${this.baseUrl}/FocusAreas/GetUSFocusAreas`);
  }

  getFocusSubAreas(issueId: number): Observable<GetFocusSubAreasResponse> {
    return this.http.get<GetFocusSubAreasResponse>(
      `${this.baseUrl}/FocusSubAreas/GetUSFocusSubAreasForArea?IssueId=${issueId}`,
    );
  }

  getSelectedFocusAreas(grantId: number): Observable<GetSelectedFocusAreasResponse> {
    return this.http.get<GetSelectedFocusAreasResponse>(
      `${this.baseUrl}/USGrantFocusAreas/GetUSGrantFocusAreasAll?GrantID=${grantId}`,
    );
  }

  saveFocusAreas(payload: SaveFocusAreasPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${this.baseUrl}/USGrantFocusAreas/InsertUSGrantFocusAreas`,
      payload,
    );
  }


  // BENEFICIARIES APIs


  getBeneficiaries(): Observable<GetBeneficiariesResponse> {
    return this.http.get<GetBeneficiariesResponse>(
      `${this.baseUrl}/Beneficiaries/GetBeneficiaries`,
    );
  }

  getSelectedFocusGroups(grantId: number): Observable<GetSelectedSubEntitiesResponse> {
    return this.http.get<GetSelectedSubEntitiesResponse>(
      `${this.baseUrl}/USGrantSubEntities/LisSubEntitiesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  getSelectedBeneficiaries(grantId: number): Observable<GetSelectedBeneficiariesResponse> {
    return this.http.get<GetSelectedBeneficiariesResponse>(
      `${this.baseUrl}/USGrantBeneficiaries/ListBeneficiariesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  insertSubEntities(payload: InsertSubEntitiesPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${this.baseUrl}/USGrantSubEntities/InsertUSGrantSubEntitiesJSON`,
      payload,
    );
  }

  insertBeneficiaries(payload: InsertBeneficiariesPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${this.baseUrl}/USGrantBeneficiaries/InsertUSGrantBeneficiariesJSON`,
      payload,
    );
  }


  // ENTITIES APIs


  getEntities(): Observable<GetEntitiesResponse> {
    return this.http.get<GetEntitiesResponse>(`${this.baseUrl}/Entities/GetEntities`);
  }

  getSubEntities(entId: number): Observable<GetSubEntitiesResponse> {
    return this.http.get<GetSubEntitiesResponse>(
      `${this.baseUrl}/SubEntities/GetSubEntitiesForEntity?EntId=${entId}`,
    );
  }

  // STATES / COUNTIES APIs

  getAllStates(): Observable<GetStatesResponse> {
    return this.http.get<GetStatesResponse>(`${this.baseUrl}/States/GetAllStates`);
  }

  getCountiesByState(stateId: number): Observable<GetCountiesResponse> {
    return this.http.get<GetCountiesResponse>(
      `${this.baseUrl}/GEOCounties/GetGEOCountiesForStates?StateID=${stateId}`,
    );
  }


  // SEO / SOCIAL APIs


  getSeoSocial(refId: number) {
    return this.http.get<any>(
      `${this.baseUrl}/URLSocialMedia/GetURLSocialMediaDetailForRefrence?RefID=${refId}&RecType=UG`,
    );
  }

  updateSeoSocial(refId: number, payload: any) {
    return this.http.post(
      `${this.baseUrl}/URLSocialMedia/UpdateURLSocialMediaURLRecord?RefID=${refId}&RecType=UG`,
      payload,
    );
  }
}

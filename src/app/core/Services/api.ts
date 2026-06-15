import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  // OTHER APIs
  private uploadUrl =
    'https://2m3attvzvf.execute-api.us-east-1.amazonaws.com/US-Release-Domain-RestAPI-Live-UploadFile';

  private donorUrl = 'https://adminapi.grantsforus.app/api';

  constructor(private http: HttpClient) {}

  // GRANT APIs

  getGrants(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.baseUrl}/USGrants/GetUSGrantsGridPaging`, payload);
  }

  getGrantById(id: number): Observable<GrantApiResponse> {
    return this.http.get<GrantApiResponse>(
      `${environment.baseUrl}/USGrants/GetUSGrantsDetail?id=${id}`,
    );
  }

  updateGrant(id: number, payload: any) {
    return this.http.post(`${environment.baseUrl}/USGrants/UpdateUSGrants?id=${id}`, payload);
  }

  apiUpload(payload: any) {
    return this.http.post(this.uploadUrl, payload);
  }

  insertGrant(payload: any) {
    return this.http.post(`${environment.baseUrl}/USGrants/InsertUSGrants`, payload);
  }

  // SEARCH DONORS

  searchDonors(donorType: string, searchText: string): Observable<any> {
    return this.http.get<any>(
      `${this.donorUrl}/USDonors/GetUSDonorsByType?donorType=${donorType}&searchText=${searchText}`,
    );
  }

  // GEO LOCATION APIs

  getTownShips(): Observable<GetTownshipResponse> {
    return this.http.get<GetTownshipResponse>(`${environment.baseUrl}/TownShips/GetTownShips`);
  }

  getInsularAreas(): Observable<GetInsularResponse> {
    return this.http.get<GetInsularResponse>(`${environment.baseUrl}/InsularAreas/GetInsularAreas`);
  }

  getCities(): Observable<GetCitiesResponse> {
    return this.http.get<GetCitiesResponse>(`${environment.baseUrl}/Cities/GetCities`);
  }

  getStates(): Observable<GetStatesResponse> {
    return this.http.get<GetStatesResponse>(`${environment.baseUrl}/States/GetUSStates`);
  }

  getSelectedCities(grantId: number): Observable<GetSelectedCitiesResponse> {
    return this.http.get<GetSelectedCitiesResponse>(
      `${environment.baseUrl}/USGrantCities/ListCitiesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  getSelectedStates(grantId: number): Observable<GetSelectedStatesResponse> {
    return this.http.get<GetSelectedStatesResponse>(
      `${environment.baseUrl}/USGrantStates/ListGeoStatesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  getSelectedTownships(grantId: number): Observable<GetSelectedTownshipsResponse> {
    return this.http.get<GetSelectedTownshipsResponse>(
      `${environment.baseUrl}/USGrantTownships/ListTownshipsForSelectedGrant?GrantID=${grantId}`,
    );
  }

  getSelectedInsular(grantId: number): Observable<GetSelectedInsularResponse> {
    return this.http.get<GetSelectedInsularResponse>(
      `${environment.baseUrl}/USGrantInsularAreas/ListInsularAreasForSelectedGrant?GrantID=${grantId}`,
    );
  }

  insertGrantCities(payload: SaveCitiesPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${environment.baseUrl}/USGrantCities/InsertUSGrantCitiesJSON`,
      payload,
    );
  }

  insertGrantInsular(payload: SaveInsularPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${environment.baseUrl}/USGrantInsularAreas/InsertUSGrantInsularAreasJSON`,
      payload,
    );
  }

  insertGrantTownships(payload: SaveTownshipPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${environment.baseUrl}/USGrantTownships/InsertUSGrantTownshipsJSON`,
      payload,
    );
  }

  insertGrantStates(payload: SaveStatesPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${environment.baseUrl}/USGrantStates/InsertUSGrantGeoStates`,
      payload,
    );
  }

  // FOCUS AREAS APIs

  getFocusAreas(): Observable<GetFocusAreasResponse> {
    return this.http.get<GetFocusAreasResponse>(
      `${environment.baseUrl}/FocusAreas/GetUSFocusAreas`,
    );
  }

  getFocusSubAreas(issueId: number): Observable<GetFocusSubAreasResponse> {
    return this.http.get<GetFocusSubAreasResponse>(
      `${environment.baseUrl}/FocusSubAreas/GetUSFocusSubAreasForArea?IssueId=${issueId}`,
    );
  }

  getSelectedFocusAreas(grantId: number): Observable<GetSelectedFocusAreasResponse> {
    return this.http.get<GetSelectedFocusAreasResponse>(
      `${environment.baseUrl}/USGrantFocusAreas/GetUSGrantFocusAreasAll?GrantID=${grantId}`,
    );
  }

  saveFocusAreas(payload: SaveFocusAreasPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${environment.baseUrl}/USGrantFocusAreas/InsertUSGrantFocusAreas`,
      payload,
    );
  }

  // BENEFICIARIES APIs

  getBeneficiaries(): Observable<GetBeneficiariesResponse> {
    return this.http.get<GetBeneficiariesResponse>(
      `${environment.baseUrl}/Beneficiaries/GetBeneficiaries`,
    );
  }

  getSelectedFocusGroups(grantId: number): Observable<GetSelectedSubEntitiesResponse> {
    return this.http.get<GetSelectedSubEntitiesResponse>(
      `${environment.baseUrl}/USGrantSubEntities/LisSubEntitiesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  getSelectedBeneficiaries(grantId: number): Observable<GetSelectedBeneficiariesResponse> {
    return this.http.get<GetSelectedBeneficiariesResponse>(
      `${environment.baseUrl}/USGrantBeneficiaries/ListBeneficiariesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  insertSubEntities(payload: InsertSubEntitiesPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${environment.baseUrl}/USGrantSubEntities/InsertUSGrantSubEntitiesJSON`,
      payload,
    );
  }

  insertBeneficiaries(payload: InsertBeneficiariesPayload) {
    return this.http.post<ApiSuccessResponse>(
      `${environment.baseUrl}/USGrantBeneficiaries/InsertUSGrantBeneficiariesJSON`,
      payload,
    );
  }

  // ENTITIES APIs

  getEntities(): Observable<GetEntitiesResponse> {
    return this.http.get<GetEntitiesResponse>(`${environment.baseUrl}/Entities/GetEntities`);
  }

  getSubEntities(entId: number): Observable<GetSubEntitiesResponse> {
    return this.http.get<GetSubEntitiesResponse>(
      `${environment.baseUrl}/SubEntities/GetSubEntitiesForEntity?EntId=${entId}`,
    );
  }

  // STATES / COUNTIES APIs

  updateGrantTags(id: number, payload: any) {
    return this.http.post(`${environment.baseUrl}/USGrants/UpdateUSGrantsTags?id=${id}`, payload);
  }
  insertGrantStatesJSON(payload: any) {
    return this.http.post(`${environment.baseUrl}/USGrantStates/InsertUSGrantStatesJSON`, payload);
  }

  getAllStates(): Observable<GetStatesResponse> {
    return this.http.get<GetStatesResponse>(`${environment.baseUrl}/States/GetAllStates`);
  }

  getCountiesByState(stateId: number): Observable<GetCountiesResponse> {
    return this.http.get<GetCountiesResponse>(
      `${environment.baseUrl}/GEOCounties/GetGEOCountiesForStates?StateID=${stateId}`,
    );
  }
  // Counties saved data
  getSelectedCounties(grantId: number): Observable<any> {
    return this.http.get<any>(
      `${environment.baseUrl}/USGrantCounties/ListCountiesForSelectedGrant?GrantID=${grantId}`,
    );
  }

  insertGrantCounties(payload: any) {
    return this.http.post(
      `${environment.baseUrl}/USGrantCounties/InsertUSGrantCountiesJSON`,
      payload,
    );
  }
  // SEO / SOCIAL APIs

  getSeoSocial(refId: number) {
    return this.http.get<any>(
      `${environment.baseUrl}/URLSocialMedia/GetURLSocialMediaDetailForRefrence?RefID=${refId}&RecType=UG`,
    );
  }

  updateSeoSocial(refId: number, payload: any) {
    return this.http.post(
      `${environment.baseUrl}/URLSocialMedia/UpdateURLSocialMediaURLRecord?RefID=${refId}&RecType=UG`,
      payload,
    );
  }

  getAllMembers(payload: any): Observable<any> {
    return this.http.post(
      'https://ang-dnd.fundsforngospremium.com/api/Member/GetAllMembers',
      payload,
    );
  }
}

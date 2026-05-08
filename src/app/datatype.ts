// ================== GRANT (UI MODEL) ==================
export interface GrantDetail {
  id: number;
  title: string;
  friendlyURL: string;
  linkUrl: string;
  postDate: string;
  deadlineDate: string;
  isOngoing: boolean;
  shortInfo: string;
  donorType: string;
  donorAgency: string;
  donorAgencyOther: string;
  grantType: string;
  grantDuration: string;
  grantSize: string;
  status: string;
  letterText: string;
  img: string;
}

// ================== GRANT API RESPONSE ==================
export interface GrantApiResponse {
  usGrantDataWithURL: {
    grantData: {
      grantIndex: number;
      grantTitle: string;
      linkURL: string;
      postDate: string;
      deadLineDate: string;
      shortIntro: string;
      donorType: string;
      grantLogoImage: string;
      donorAgency: string;
      grantType: string;
      grantSize: string;
      grantDuration: string;
      status: string;
      grantContent: string;
      onGoingGrants: number;
    };
    urlData?: {
      friendlyURLText: string;
    };
  };
}

// ================== GRANTS LIST ==================
export interface GrantListItem {
  grantIndex: number;
  grantTitle: string;
  postDate: string;
  deadLineDate: string;
}

// ================== COMMON ==================
export interface DropdownItem {
  item_id: number;
  item_text: string;
}

// ================== STATES ==================
export interface State {
  stateIndex: number;
  stateName: string;
}

export interface GetStatesResponse {
  usStates: State[];
}

// ================== COUNTIES ==================
export interface County {
  countyName: string;
}

export interface GetCountiesResponse {
  usgeoCounties: County[];
}

// ================== CITIES ==================
export interface City {
  cityIndex: number;
  cityName: string;
}

export interface GetCitiesResponse {
  usCities: City[];
}

// ================== TOWNSHIP ==================
export interface Township {
  townshipIndex: number;
  townshipName: string;
}

export interface GetTownshipResponse {
  usTownships: Township[];
}

// ================== INSULAR ==================
export interface InsularArea {
  areaIndex: number;
  areaName: string;
}

export interface GetInsularResponse {
  usInsularAreas: InsularArea[];
}

// ================== FOCUS AREA ==================
export interface FocusArea {
  issueIndex: number;
  issueName: string;
}

export interface GetFocusAreasResponse {
  successCode: number;
  usFocusAreas: FocusArea[];
}

// ================== FOCUS SUB AREA ==================
export interface FocusSubArea {
  subIssueIndex: number;
  subIssueName: string;
}

export interface GetFocusSubAreasResponse {
  successCode: number;
  myList: FocusSubArea[];
}

// ================== BENEFICIARY ==================
export interface Beneficiary {
  beneficiaryIndex: number;
  beneficiaryName: string;
}

export interface GetBeneficiariesResponse {
  tempUSBeneficiaries: Beneficiary[];
}

// ================== ENTITY ==================
export interface Entity {
  entIndex: number;
  entName: string;
}

export interface GetEntitiesResponse {
  usEntities: Entity[];
}

export interface GetSubEntitiesResponse {
  subEntities: SubEntity[];
}

// ================== SELECTED GEO ==================

export interface SelectedCity {
  recordIndex: number;
  grantIndex: number;
  cityIndex: number;
  cityName: string;
}

export interface GetSelectedCitiesResponse {
  status: number;
  successCode: number;
  message: string;
  tempUSGrantCities: SelectedCity[];
}

export interface SelectedState {
  recordIndex: number;
  grantIndex: number;
  stateIndex: number;
  stateName: string;
  countryIndex: number;
}

export interface GetSelectedStatesResponse {
  status: number;
  successCode: number;
  message: string;
  tempUSGrantStates: SelectedState[];
}

export interface SelectedTownship {
  townshipIndex: number;
  townshipName: string;
}

export interface GetSelectedTownshipsResponse {
  status: number;
  successCode: number;
  message: string;
  tempUSGrantTownships: SelectedTownship[];
}

export interface SelectedInsular {
  areaIndex: number;
  areaName: string;
}

export interface GetSelectedInsularResponse {
  status: number;
  successCode: number;
  message: string;
  tempUSGrantInsularAreas: SelectedInsular[];
}

export interface GeoDropdown {
  label: string;
  data: DropdownItem[];
  selected: DropdownItem[];
}

// ================= SAVE RESPONSE =================

export interface ApiSuccessResponse {
  status: number;
  successCode: number;
  message: string;
}

// ================= SAVE PAYLOADS =================

export interface SaveCityPayload {
  cityIndex: number;
  cityName: string;
}

export interface SaveInsularPayload {
  grantIndex: number;
  grantInsularAreas: {
    areaIndex: number;
    areaName: string;
  }[];
}

export interface SaveTownshipPayload {
  grantIndex: number;
  grantTownships: {
    townshipIndex: number;
    townshipName: string;
  }[];
}

export interface SaveStateItem {
  countryIndex: number;
  grantIndex: number;
  recordIndex: number;
  stateIndex: number;
  stateName: string;
}

export interface SaveStatesPayload {
  grantIndex: number;
  usGrantStates: SaveStateItem[];
  userEmail: string;
  userIndex: number;
}

export interface SaveGrantCityItem {
  cityIndex: number;
  cityName: string;
}

export interface SaveCitiesPayload {
  grantIndex: string;
  grantCities: SaveGrantCityItem[];
}

export interface SelectedFocusArea {
  grantIndex: number;
  issueIndex: number;
  subIssueIndex: number;
  issueName: string;
  subIssueName: string;
}

export interface GetSelectedFocusAreasResponse {
  status: number;
  successCode: number;
  message: string;
  tempUSGrantFocusAreas: SelectedFocusArea[];
}

export interface SaveFocusAreaRow {
  grantIndex: number;
  subIssueIndex: number;
  subIssueName: string;
  issueIndex: number;
  issueName: string;
  userIndex: number | null;
  userEmail: string | null;
}

export interface SaveFocusAreasPayload {
  focusAreas: SaveFocusAreaRow[];
  grantID: string;
  issueID: number;
  userEmail: string;
  userIndex: number;
}

export interface SubEntity {
  subEntIndex: number;
  subEntName: string;
  entIndex: number;
  entitiyName: string;
}

export interface SelectedSubEntity {
  entityName: string;
  subEntName: string;
}

export interface GetSelectedSubEntitiesResponse {
  tempUSGrantSubEnt: SelectedSubEntity[];
}

export interface SelectedBeneficiary {
  beneficiaryName: string;
}

export interface GetSelectedBeneficiariesResponse {
  tempUSGrantBeneficiaries: SelectedBeneficiary[];
}

export interface InsertSubEntityRow {
  entIndex: number;
  entitiyName: string;
  subEntIndex: number;
  subEntName: string;
}

export interface InsertSubEntitiesPayload {
  grantIndex: string;
  grantSubEntities: InsertSubEntityRow[];
}

export interface InsertBeneficiaryRow {
  beneficiaryIndex: number;
  beneficiaryName: string;
}

export interface InsertBeneficiariesPayload {
  grantIndex: string;
  grantBeneficiaries: InsertBeneficiaryRow[];
}
export interface FocusGroupState {
  beneficiaries: string[];
  entities: Record<string, string[]>;
}
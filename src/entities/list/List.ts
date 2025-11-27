export interface List {
  id?: string;
  collectionId: string;
  name: string;
  items: string[];
  isOrderedList: boolean;
  note?: string;
}
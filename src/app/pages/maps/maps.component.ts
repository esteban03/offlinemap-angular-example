import { Component, OnInit } from '@angular/core';
import { NgxIndexedDB } from 'ngx-indexed-db';
declare let L: any;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.sass']
})
export class MapsComponent implements OnInit {

  db: NgxIndexedDB; // initialized by initDatabase()

  constructor() {
  }

  ngOnInit() {
    this.initMap();
  }

  async initMap() {
    await this.initDatabase();
    this.map();
  }

  async initDatabase() {
    this.db = new NgxIndexedDB('offlinemap', 1);
    return await this.db.openDatabase(1, evt => {
        evt.currentTarget.result.createObjectStore('tiles');
    });
  }

  addTile(azulejo) {
    fetch( azulejo.url )
        .then( image => image.blob() )
        .then( image => {
            this.db.add('tiles', image, azulejo.url ).then(
                () => {
                    console.log('add azulejo done: ', azulejo);
                }
            );
        });
  }

  map() {
    const map         = L.map('map');
    const mapOrigin   = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // TODO: for some reason it only works by implementing the default initialization of the map
    L.tileLayer( mapOrigin , {
        attribution
    }).addTo(map);

    const tilesDb = this.tilesDb();

    // tslint:disable-next-line:align
    const offlineLayer = L.tileLayer.offline( mapOrigin , tilesDb, {
        attribution,
        sudbomains: 'abc',
        minZoom: 13,
        maxZoom: 19,
        crossOrigin: true
    });

    const offlineControl = L.control.offline(offlineLayer, tilesDb, {
        saveButtonHtml: '<i class="fa fa-download" aria-hidden="true"></i>',
        removeButtonHtml: '<i class="fa fa-trash" aria-hidden="true"></i>',
        confirmSavingCallback: (nTilesToSave, continueSaveTiles) => {
            if (window.confirm('Save ' + nTilesToSave + '?')) {
                continueSaveTiles();
            }
        },
        confirmRemovalCallback: (continueRemoveTiles) => {
            if (window.confirm('Remove all the tiles?')) {
                continueRemoveTiles();
            }
        },
        minZoom: 13,
        maxZoom: 19
    });

    offlineLayer.addTo(map);
    offlineControl.addTo(map);

    // set my location in map
    navigator.geolocation.getCurrentPosition( (position) => {
        map.setView({
            lat: position.coords.latitude,
            lng: position.coords.longitude
        }, 18);
    });

  }

  tilesDb() {
    return {
        getItem: (key: any) => {
            this.db.getByKey('tiles', key);
        },
        saveTiles: (tileUrls: any) => {
            for (const tile of tileUrls) {
                this.addTile( tile );
            }
        },
        clear: () => {
            this.db.clear('tiles');
        }
    };
  }

}

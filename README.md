# Spedizioni limitate in una certa zona? Non c’e’ problema.

---

*Per gestire le restrizioni geografiche alle spedizioni, abbiamo preparato uno script per
escludere location specifiche o ridurre il bid su determinate aree tramite il Proximity Targeting*

---

La situazione che il nostro Paese sta vivendo è a dir poco complessa. L’avvento del coronavirus, 
oltre a stravolgere l’esistenza della comunita’, ha anche modificato il comportamento dei consumatori.

Alcuni servizi di spedizione stanno riscontrando notevoli difficoltà di consegna in alcune aree. 
Per chi vende online potrebbe di fatto essere necessario sospendere le campagne nelle zone che 
non possono essere servite adeguatamente e in questo modo ottimizzare il loro investimento.

A Booster Box abbiamo preparato uno script di Google Ads che può aiutare i marketing manager a 
ottimizzare il budget a disposizione e quindi gestire le proprie campagne in maniera più efficiente.

Come sempre, condividiamo lo script gratuitamente. Invitiamo chi lo utilizza a considerare una donazione 
all’Ospedale di Bergamo. La  provincia di Bergamo è quella con il maggior numero di contagiati da 
Coronavirus: più di 6700 casi. I medici e gli operatori sanitari dell’ospedale Papa Giovanni XXIII sono 
impegnati senza sosta nella battaglia contro il virus.
</br> [dona](https://www.gofundme.com/f/emergenza-covid-cesvi-per-bergamo)

Vediamo più da vicino come funziona il nostro script e come può aiutare i marketing manager nell’ottimizzazione delle campagne.

## Come funziona il nostro script
Innanzitutto, sappiamo bene che Google Ads non consente sempre in  maniera puntuale il targeting per CAP… figuriamoci 
se lasciamo che ci fermi un dettaglio del genere!

Il nostro script, partendo da una lista di CAP, identifica le aree geografiche e le esclude. In questo modo, è possibile ottimizzare 
le campagne riducendo la spesa su una lista di CAP definiti dall’utente. Nello specifico, lo script esegue due diverse azioni:
* Se il CAP è presente tra le 
[location predefinite da Google](http://developers.google.com/adwords/api/docs/appendix/geo/geotargets-2020-03-03.csv), 
tale location verra' totalmente esclusa.
* Se il CAP NON E' presente tra queste location, verra' applicato un Bid Adjustment del -90% su 
un'approssimazione dell'area del CAP individuato.

Ad ogni run dello Script avrete la possibilità di ricevere un recap via email delle modifiche eseguite e degli eventuali errori.

L’output finale dello script sarà simile all’esempio qui sotto: le zone in rosso sono le location escluse, mentre le aree in blu 
sono le aree individuate tramite Proximity Targeting e su cui viene applicata una riduzione del 90% del Bid.

![Mappa](/images/maps.png "Mappa")

---

## Come installare lo script
Adesso che abbiamo capito il funzionamento dello script, vediamo come metterlo in pratica.
#### IMPLEMENTAZIONE
* Crea una copia di [questo Spreadsheet](https://docs.google.com/spreadsheets/d/1V9zOcI_lhnYjX4JFlo14UtS32Q_vrQBw8yFU0YzsDog/copy) 
e aggiungi i CAP che vuoi escludere.
* Aggiungi la Label `EXCLUDED_COVID19` alle Campagne su cui vuoi operare.
* [Copia e Incolla](https://github.com/boosterbox/CAP-Automated-Exlcusion/blob/master/Code.gs) 
  lo Script `Code.gs` all’interno di GAds e modifica le parti rilevanti.

#### REVERSE BUTTON
Per fare reverse back al periodo pre-COVID19 ed eliminare tutte le esclusioni aggiunte dallo script,  
sarà’ sufficiente cancellare tutti i CAP nello Spreadsheet e lanciare lo Script.

#### TABELLA DEI CAP
L’elaborazione dello script ci ha permesso di ricostruire una tabella omni comprensiva dei CAP italiani 
e il loro match con Area in Chilometri Quadrati e Coordinate Geografiche.

Laddove possibile, abbiamo individuato le coordinate anche per i Comuni MultiCAP. In caso contrario, 
quel CAP verrà considerato come identificativo di tutto il comune.

Facciamo un esempio. Prendiamo il caso di Padova. Padova, come comune, si compone di 23 differenti CAP. 
Due di questi non ci permettono di risalire a specifiche per gli stessi CAP, mentre gli altri 21 sì.

Osservando la tabella seguente, si possono notare le due casistiche appena descritte:
* Per il CAP 35129 abbiamo delle coordinate specifiche e possiamo coprire un’area maggiormente definita.
* Per il CAP 35130 non siamo stati in grado di recuperare tali informazioni e perciò procediamo con l’esclusione dell’intero Comune.

![Tabella](/images/table.png "Tabella")

Puoi trovare la Tabella `[BOOSTER BOX] - Exclude Locations & Reduce Bid on Target by Proximity - CAP.csv` a questo [link](https://github.com/boosterbox/CAP-Automated-Exlcusion/blob/master/%5BBOOSTER%20BOX%5D%20-%20Exclude%20Locations%20%26%20Reduce%20Bid%20on%20Target%20by%20Proximity%20-%20CAP.csv).

#### LIMITAZIONI
* Lo Script al momento funziona solo per l’Italia.
* Al massimo possono essere applicati 500 Proximity Targeting
* Non c’è la possibilità di escludere i CAP individuati attraverso Proximity Targeting. 
Per tale motivo viene applicato una riduzione del Bid del 90%.

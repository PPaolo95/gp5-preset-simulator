# GP-5 Companion PWA

Un simulatore offline mobile-first per la preparazione di preset e l'uso live, ispirato alla logica del processore multieffetto **Valeton GP-5**.

## Funzionalità Principali
- **Motore di Raccomandazione:** Adatta automaticamente i preset (gain, EQ, compressione) in base alla chitarra selezionata (Telecaster, Les Paul, Ibanez GIO).
- **Performance Mode:** Interfaccia a tre bottoni giganti (Verse, Chorus, Solo) ottimizzata per l'uso sul palco con feedback aptico.
- **SnapTone/NAM:** Integrazione di profili di cattura neurale nel modulo AMP.
- **Tuner Live:** Accordatore visivo ad alto contrasto.
- **UI Lock:** Sistema di sicurezza "long-press" per bloccare lo schermo durante l'esecuzione.

## Guida all'Installazione (Smartphone)
1. Carica questi file su un server (es. GitHub Pages).
2. Apri l'URL dal browser del tuo smartphone (Safari su iOS, Chrome su Android).
3. Seleziona **"Aggiungi alla schermata Home"**.
4. Avvia l'app come una PWA a tutto schermo.

## Struttura Dati
L'app utilizza `localStorage` per mantenere l'ultimo stato (brano attivo, chitarra, preset modificati). I preset sono strutturati in blocchi coerenti con l'hardware reale (NR, PRE, DST, AMP, CAB, EQ, MOD, DLY, REV).

## Limitazioni
Questa è una **web-app di simulazione logica**. Non processa segnale audio reale. Serve per progettare la catena di effetti e gestire le scalette durante le prove o i concerti.
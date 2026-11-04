# Cours de physique au gymnase

Cours interactifs pour le gymnase (secondaire II), en français. Chaque cours tient dans son dossier et s'ouvre directement dans un navigateur.

- [Électricité au gymnase](#électricité-au-gymnase) : `cours-electricite/`
- [Thermodynamique au gymnase](#thermodynamique-au-gymnase) : `cours-thermodynamique/`

# Électricité au gymnase

Cours d'électricité interactif en quatre chapitres :

| Chapitre | Contenu | Animations |
|---|---|---|
| [1. Électrostatique](cours-electricite/1-electrostatique.html) | charge, électrisation, loi de Coulomb, champ électrique, tension, condensateur | influence, Coulomb, lignes de champ, canon à électrons |
| [2. Électrodynamique](cours-electricite/2-electrodynamique.html) | courant, tension, loi d'Ohm, résistivité, puissance et énergie, sécurité | électrons dans un fil, caractéristique U-I, compteur électrique |
| [3. Lois des circuits](cours-electricite/3-lois-des-circuits.html) | schémas, Kirchhoff, série, parallèle, mixte, générateur réel | guirlande, simulateur de circuit, batterie et démarreur |
| [4. Production en Suisse](cours-electricite/4-production-suisse.html) | mix 2025, induction, alternateur, hydraulique, nucléaire, solaire, réseau, transport | aimant et bobine, alternateur, centrale hydraulique, journée sur le réseau, très haute tension |

Chaque chapitre contient des schémas SVG, des exemples pratiques, des exercices avec solutions détaillées et un résumé.

## Fiche d'exercices (Word)

[`cours-electricite/fiche-exercices-electricite.docx`](cours-electricite/fiche-exercices-electricite.docx) accompagne le cours : pour chaque chapitre, des questions théoriques avec lignes de réponse et des exercices progressifs (niveaux 1 à 3), dont deux sur schéma. Le corrigé détaillé commence à la page 13, dans une section séparée qu'on peut retirer avant de distribuer. Mise en page pour la photocopie : noir et blanc, Arial 12, interligne 1,5, format A4.

## Utilisation

Ouvrir `cours-electricite/index.html` dans un navigateur. Aucune installation ni serveur n'est nécessaire : tout est en HTML, CSS et JavaScript sans dépendance. Les polices viennent de Google Fonts ; hors ligne, le navigateur utilise des polices de remplacement.

## Structure

```
cours-electricite/
  index.html                  sommaire, mode d'emploi, aide-mémoire
  1-electrostatique.html
  2-electrodynamique.html
  3-lois-des-circuits.html
  4-production-suisse.html
  assets/
    cours.css                 styles communs (thèmes clair et sombre)
    cours.js                  moteur d'animation, formatage, sommaire
    ch1.js … ch4.js           animations de chaque chapitre
```

Les chiffres suisses (production 2025, centrales, lois) proviennent de l'OFEN, de Swissolar et des exploitants ; ils sont arrondis et datent de l'automne 2026.

# Thermodynamique au gymnase

Cours de thermodynamique interactif en quatre chapitres, avec 19 simulations, un test rapide (QCM) et 7 ou 8 exercices corrigés par chapitre :

| Chapitre | Contenu | Simulations |
|---|---|---|
| [1. Température et dilatation](cours-thermodynamique/1-temperature.html) | agitation thermique, équilibre thermique, échelles Celsius, Kelvin et Fahrenheit, dilatation, anomalie de l'eau | trois états de la matière (dynamique moléculaire), deux gaz en contact, thermomètre à trois échelles, bilame et thermostat, lac au fil des saisons |
| [2. Chaleur et changements d'état](cours-thermodynamique/2-chaleur.html) | énergie interne, *Q* = *mc*Δ*T*, calorimétrie, chaleur latente, conduction, convection, rayonnement, loi de Newton | deux casseroles, calorimètre (avec métal mystère), courbe de chauffe de l'eau, mur de la maison, café et lait |
| [3. Les gaz parfaits](cours-thermodynamique/3-gaz-parfaits.html) | pression, lois de Boyle-Mariotte, Charles et Gay-Lussac, *pV* = *nRT*, théorie cinétique, pression et altitude | gaz dans un cylindre, laboratoire des lois des gaz, distribution de Maxwell, du Léman à l'Everest |
| [4. Machines thermiques](cours-thermodynamique/4-machines-thermiques.html) | travail d'un gaz, premier principe, transformations, moteur à quatre temps, Carnot, frigo et pompe à chaleur, entropie | quatre transformations, moteur à quatre temps, flux d'énergie, pompe à chaleur en hiver, détente dans le vide |

Les exercices ont une solution détaillée et, pour la plupart, une case qui vérifie le résultat numérique (virgule ou point, notation 1,5e3 acceptées ; un message signale les erreurs d'unités).

## Résumé (Word)

[`cours-thermodynamique/resume-thermodynamique.docx`](cours-thermodynamique/resume-thermodynamique.docx) résume les quatre chapitres en 9 pages A4 : définitions, tableaux de formules, valeurs utiles, pièges classiques, cinq figures (masse volumique de l'eau, courbe de chauffe, lois des gaz, transformations dans le diagramme *p*-*V*, flux d'énergie des machines) et, en dernière page, un formulaire complet avec les constantes et une méthode de résolution.

## Utilisation et structure

Ouvrir `cours-thermodynamique/index.html` dans un navigateur ; même fonctionnement que le cours d'électricité, avec le même moteur d'animation enrichi d'aides pour les graphiques, les QCM et la vérification des réponses.

```
cours-thermodynamique/
  index.html                  sommaire, mode d'emploi, aide-mémoire (constantes, tables, formulaire)
  1-temperature.html
  2-chaleur.html
  3-gaz-parfaits.html
  4-machines-thermiques.html
  resume-thermodynamique.docx résumé du cours
  assets/
    cours.css                 styles communs (thèmes clair et sombre)
    cours.js                  moteur d'animation, graphiques, QCM, vérification des réponses
    ch1.js … ch4.js           simulations de chaque chapitre
```

Les modèles sont simplifiés et le disent dans leurs légendes : dynamique moléculaire 2D en unités réduites, gaz parfaits 2D dont la pression mesurée est ramenée à *pV* = *nRT*, atmosphère standard, profils de lacs inspirés des mesures, COP réel pris à 45 % du COP de Carnot.

# Proyecto Gráficas Computacionales 2022

## Integrantes
* Karen Isabel Morgado A01027446
* Emilio Popovits Blake A01027265
* Ana Paola Minchaca García A01026744

## Cuchi Tales - Entrega Final

**Cuchi Tales** consiste en un juego donde el jugador tendrá que controlar a Cuchi, un cerdito volador que tendrá que deslizarse sobre las colinas mientras esquiva obstáculos y come manzanas para ganar puntos. Habrá enemigos en su camino que le bajarán el score y nubes que terminarán con su recorrido. En su recorrido, Cuchi se encontrará con powerups que lo ayudarán en su camino, estos siendo los siguientes:
* **Rosa** - El score del jugador se duplicará
* **Azul** - El jugador será invisible ante los enemigos y obstáculos
* **Verde** - Los enemigos y obstáculos 

En la pantalla de inicio se encuentran 3 botones:
* **Info** - Historia del personaje y nombres de los integrantes del equipo
* **Play** - Dará inicio al juego
* **Rules** - Reglas y controles del juego

Contamos con algunos módulos que nos ayudan con el funcionamiento del juego, entre ellos tenemos:
* **Audio Manager** - Aquí controlamos todos los audios y música que se estarán escuchando durante el gameplay.
* **Game Manager** - Este módulo se encarga de hacer las funcionalidades del juego como generar los assets, checar colisiones, generar nuevos mapas, eliminamos assets que ya no se usan, etc.
* **Player Control** - Se encarga del movimiento del personaje, así como la física de éste.
* **Terrain Generator** - Crea los mapas con base a fórmulas matemáticas, le agrega las texturas y se encarga de adornarlo con assets y nubes.
* **Third Person Camera** - Se encarga de seguir al jugador en su recorrido por el mapa.
* **Loaders** - Carga todos los objetos con ayuda del FBXLoader y OBJLoader. 

Los assets que incluimos son los siguientes:
* Asset de cuchi
* Asset de manzana
* Asset de nube
* Asset de pájaro enemigo
* Asset de los 3 powerups
* Assets de rocas
* Assets de arbustos
* Assets de árboles

El jugador empezará su recorrido en el primer mapa, el cual tiene una dificultad para principiantes, este servirá para que el jugador se familiarice con las mecánicas del juego. Al final de cada mapa, el jugador deberá saltar para llegar al siguiente mapa, que tendrá mayor dificultad ya que conforme se vaya avanzando, los obstáculos serán más difíciles de esquivar y la cantidad de puntos a ganar irá disminuyendo. Si el jugador cae fuera del mapa, será game over y deberá reiniciar el juego. 

¿Crees poder ayudar a Cuchi a superar la mayor cantidad de mapas? 

## Screenshots
![img](https://media.discordapp.net/attachments/700933270614966334/988639615483277362/Captura_de_Pantalla_2022-06-20_a_las_22.00.28.png?width=2148&height=1138)
![img](https://media.discordapp.net/attachments/700933270614966334/988639919356399686/Captura_de_Pantalla_2022-06-20_a_las_22.01.54.png?width=2148&height=1138)
![img](https://media.discordapp.net/attachments/700933270614966334/988640120968187964/Captura_de_Pantalla_2022-06-20_a_las_22.02.44.png?width=2148&height=1137)
![img](https://media.discordapp.net/attachments/700933270614966334/988640540876754954/Captura_de_Pantalla_2022-06-20_a_las_22.04.26.png?width=2156&height=1138)
![img](https://media.discordapp.net/attachments/700933270614966334/988640808209113118/Captura_de_Pantalla_2022-06-20_a_las_22.05.20.png?width=2144&height=1138)


# Proyecto Gráficas Computacionales 2022

## Integrantes
* Karen Isabel Morgado A01027446
* Emilio Popovits Blake A01027265
* Ana Paola Minchaca García A01026744


## Propuestas 
### Puzzle 3D
Juego similar a “Captain Toad” donde tendremos a nuestro personaje principal en busca de una llave dorada que le dará acceso a la salida del nivel. Será un mundo totalmente 3D donde el jugador podrá cambiar la perspectiva del juego usando Shift, de esta manera el jugador podrá tener diferentes vistas que serán necesarias si quiere completar el nivel exitosamente. Además, el jugador podrá moverse con las teclas W, A, S, D y saltar con la tecla de espacio. Se tendrá enemigos y/o obstáculos en el recorrido que harán más difícil el nivel. Para esta idea es crucial el uso de los assets.

<p align="center">
  <img width="400" height="300" src="https://i.blogs.es/faf0f1/captain/840_560.jpg">
</p>

### Historia interactiva/Recorrido interactivo
Historia corta donde el jugador puede decidir el rumbo que va a tomar la historia mediante clicks en las opciones que aparecerán en la pantalla, con esto la historia se ramificará y los escenarios van a cambiar según la elección. Es un mundo 3D y el jugador va a poderlo recorrer mientras le aparece el texto y las opciones, no habrá personajes. La historia tendrá un solo final. Por el momento se tiene pensado que cuente "La casa de Asterión". [Inspirado en el test del Patronus de Wizarding World.](https://www.youtube.com/watch?v=4jTMGnALzwM)

<p align="center">
  <img width="400" height="300" src="https://user-images.githubusercontent.com/42215143/158502634-e51e8c72-db81-4941-9c87-5c28e640a6e9.png">
</p>

### Tiny Wings 3D
Juego similar a Tiny Wings pero nuestra propuesta es hacerlo en 3D. Se tiene pensado que el personaje a ser controlado sea un cerdito volador o en realidad cualquier animal si decidimos cambiar de opinión. El punto de vista que tendrá el jugador será en tercera persona, por lo que verá al cerdito por detrás/de lado mientras la colina por la que tendrá que bajar estará abajo. En esta colina habrá obstáculos (nubes) que deberá evadir, para lograr esto la interacción vendría de la tecla de espacio, con esta el personaje bajará al suelo para recolectar manzanas/comida que harán que su puntuación suba y que a la hora de perder y tocar un obstáculo, esta puntuación quede registrada. El objetivo principal es hacer que el personaje logre la mayor puntuación posible. 

<p align="center">
  <img width="400" height="300" src="https://www.cnet.com/a/img/resize/6e06af91b18323fa1df098972e5afdb5fc1e9f9e/hub/2011/02/28/23d65373-cbf2-11e2-9a4a-0291187b029a/orig-tw1.jpg?auto=webp&width=768">
</p>

Para pantallas, se tiene planeado que esté la de inicio, donde el jugador podrá presionar un botón para empezar, así como un botón de créditos donde venga información sobre los desarrolladores del juego y como última una de pausa una vez ya se esté jugando. Para hacer el escenario y el movimiento de la cámara, se tiene pensado usar un efecto de “parallax” para que solo sea necesario tener el fondo una vez, y que la cámara se esté moviendo para hacer la ilusión de que el fondo se repite, un ejemplo de esto es lo siguiente: [Ejemplo de Parallax en JS.](https://codepen.io/novogrammer/pen/eJzVRz) Para los otros elementos que forman parte del escenario, tenemos la “colina” por la que subirá y bajará el personaje, aquí queremos hacer uso de texturas y sombras para darle el efecto que queremos. Igualmente tenemos el fondo del que vendrá la iluminación. Durante el juego, habrá música de fondo así como efectos de sonido cada vez que el personaje recolecte una manzana. Y la animación vendría del movimiento del personaje al volar, así como al momento de subir y bajar. 

Los assets que tenemos pensados usar son los siguientes:
* [Asset de cerdito/cuchi 3D.](https://www.cgtrader.com/free-3d-models/animals/mammal/cute-pig-e9e66a0b-5d45-49c8-bb4b-2cd97ac16037)
* [Asset de alas 3D.](https://www.cgtrader.com/free-3d-models/character/other/angel-wings-type-3)
* [Asset de manzana 3D.](https://www.turbosquid.com/3d-models/apple-cartoon-3d-1495154)
* [Asset de nube 3D.](https://www.turbosquid.com/3d-models/cloud-3d-model-1340488)

Se tiene planeado que haya 3 niveles, en los cuales la complejidad va a variar dependiendo del nivel que el jugador desee jugar. El primer nivel va a ser el más básico de todos, tipo de “introducción” para que el jugador vea cómo funciona el juego, aquí solo deberá recolectar manzanas en la colina y acabar el nivel. Para el segundo nivel, el jugador además de recolectar manzanas, va a tener que esquivar obstáculos que se encuentran en el aire, lo que hará que sea más difícil. Y finalmente en el tercer nivel, se tendrá que recolectar manzanas que estén en el aire y en la colina, teniendo que combatir con enemigos que se encuentran además de esquivar los obstáculos. Los niveles estarán durando entre 30 segundos y un minuto.

Para agregarle jugabilidad, va a haber 3 power ups que van a estar esparcidos en los niveles para ayudar al jugador a completar el nivel, todos tendrán una duración de 10 segundos. El primer power up sería el de invisibilidad, este ayudará al jugador a ser invisible ante los obstáculos y/o enemigos que aparezcan durante el nivel. Como segundo power up está el de ataque, esto hará que el personaje dispare municiones por su boca y pueda eliminar a los enemigos. Y como último power up tenemos slow que hará que el personaje baje la velocidad, lo que le permitirá que sea más fácil esquivar los obstáculos y enemigos, así como agarrar las manzanas.

Por el momento el plan de trabajo que se tiene para la primera entrega es tener un nivel base con el movimiento del personaje principal y que se tenga un score, para lograr esto la división del trabajo sería la búsqueda de assets, animaciones, la incorporación de los assets en el escenario, creación de escenas con el fondo y botones y las mecánicas y funcionalidades del juego. 
* Ana: búsqueda de assets, diseño del fondo, incorporación de assets, animaciones
* Karen: escena de inicio y pausa, incorporación de los assets, animaciones
* Emilio: mecánicas del juego, incorporación de assets, animaciones

Para agilizar el trabajo, si vemos que alguna área va más lento, será necesario que todos trabajemos en eso para acabar todo a tiempo. 

El proyecto va a seguir la siguiente estructura de carpetas:
```
- / 			        # Raíz de todo el proyecto
    - README.md			# Archivo con los datos del proyecto (este archivo)
    - source			# Carpeta con el código fuente de la solución
    - models			# Carpeta con los assets a utilizar
    - textures			# Carpeta con las texturas a utilizar
```


A continuación se tiene un boceto de lo que serían las pantallas de inicio y un nivel del juego. 

![img](https://cdn.discordapp.com/attachments/853383945805758464/954559756561944586/unknown.png)
![img](https://cdn.discordapp.com/attachments/853383945805758464/954559809426976788/unknown.png)




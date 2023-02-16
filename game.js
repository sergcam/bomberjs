let app;
let background;
let player1, player2;
let map;
let pressed = {};
let pressed1 = {};
let pressed2 = {};
let lastPressed1 = 'none';
let lastPressed2 = 'none';
let lastMove1 = 'none';
let lastMove2 = 'none';
let frameCounter = 0;
let bomb1;
let bomb2;
let p1bomb = false;
let p2bomb = false;
let fire1;
let fire2;
let gameStart = false;
let done = false;
let lastWin;
let screen;

class Map{
    // value key:
    // 0: empty space
    // 1: fire (death space)
    // 10+ impassiable objects
    // 11: stone barrier
    // 12: bomb
    // 99: map border (not used on map)
    
    // initializes map with barriers at correct coordinates
    constructor(){
        this.grid = [
            [0,0,0,0,0,0,0,0,0],
            [0,11,0,11,0,11,0,11,0],
            [0,0,0,0,0,0,0,0,0],
            [0,11,0,11,0,11,0,11,0],
            [0,0,0,0,0,0,0,0,0],
            [0,11,0,11,0,11,0,11,0],
            [0,0,0,0,0,0,0,0,0],
            [0,11,0,11,0,11,0,11,0],
            [0,0,0,0,0,0,0,0,0],
            [0,11,0,11,0,11,0,11,0],
            [0,0,0,0,0,0,0,0,0]
        ];
        
    }

    //returns value at space indicated by x,y coords. returns 99 if map border detected
    getSpace(x,y){
        if(x < 0 || y < 0 || x > 10 || y > 8){
            return 99;
        }
        else{
            return this.grid[x][y];
        }
    }

    //sets space at x,y to value n. returns nothing
    setSpace(x,y,n){
        this.grid[x][y] = n;
    }
}

class Player {
    constructor(color,x,y) {
        //create sprite based on color. only colors are black and white
        if(color == 'white'){
            this.sprite = PIXI.Sprite.from('player1down.png');
            this.downSprite = 'player1down.png';
            this.upSprite = 'player1up.png';
            this.leftSprite = 'player1left.png';
            this.rightSprite = 'player1right.png';
        }
        else if(color == 'black'){
            this.sprite = PIXI.Sprite.from('player2down.png');
            this.downSprite = 'player2down.png';
            this.upSprite = 'player2up.png';
            this.leftSprite = 'player2left.png';
            this.rightSprite = 'player2right.png';
        }
        else{
            this.sprite = PIXI.Sprite.from('player1down.png');
            this.downSprite = 'player1down.png';
            this.upSprite = 'player1up.png';
            this.leftSprite = 'player1left.png';
            this.rightSprite = 'player1right.png';
        }
        this.spawn = [x,y]; //saves inital spawn for reset
        this.xpos = x;
        this.ypos = y; //set starting x and y coords
        this.alive = true; //always alive at construction
        app.stage.addChild(this.sprite); //render player
        
    }
    
    //moves player 1 unit in the specified direction (up,down,left, or right)
    //postion is not changed if col is true (collision detected)
    move(dir,col){
        switch(dir){
            case 'up': 
                if(!col){
                    this.ypos-=1;
                }
                this.sprite.texture = PIXI.Texture.from(this.upSprite);
                break;
            case 'down':
                if(!col){
                    this.ypos+=1;
                }
                this.sprite.texture = PIXI.Texture.from(this.downSprite);
                break;
            case 'left':
                if(!col){
                    this.xpos-=1;
                }
                this.sprite.texture = PIXI.Texture.from(this.leftSprite);
                break;
            case 'right':
                if(!col){
                    this.xpos+=1;
                }
                this.sprite.texture = PIXI.Texture.from(this.rightSprite);
                break;
        }
    }

    //sets alive to false
    kill(){
        this.alive = false;
    }

    //respawns player at inital spawn position
    reset(){
        app.stage.removeChild(this.sprite);
        this.xpos = this.spawn[0];
        this.ypos = this.spawn[1];
        this.alive = true;
        app.stage.addChild(this.sprite);
        
    }

    //returns true if player is alive, false otherwise
    isAlive(){
        return this.alive;
    }

    //returns x coord on map grid
    getX(){
        return this.xpos;
    }

    //returns y coord on map grid
    getY(){
        return this.ypos;
    }

    //update player position and remove sprite check if not alive 
    update(){
        //1 grid space = 96 pixels
        this.sprite.x = this.xpos * 96
        this.sprite.y = this.ypos * 96
        if(!this.alive){
            app.stage.removeChild(this.sprite);
        }
    }
}

class Bomb{
    constructor(x,y){
        this.timer = 0; //internal bomb time 
        this.detTime = 120; //time to  detonate (frames)
        this.fireTime = 60; //time burning after detonate (frames)
        this.exploded = 0; //detonation stage. 0=not detonated, 1=burning, 2=gone
        this.xpos = x;
        this.ypos = y;

        //generate and render bomb
        let circle = new PIXI.Graphics();
        circle.beginFill(0x000000);
        circle.drawCircle(0, 0, 40);
        circle.endFill();
        circle.x = x * 96 + 48;
        circle.y = y * 96 + 48;
        app.stage.addChild(circle);

        this.circle = circle;

    }

    //returns detonation stage
    explode(){
        return this.exploded;
    }

    //returns x coord on map grid
    getX(){
        return this.xpos;
    }
    
    //returns x coord on map grid
    getY(){
        return this.ypos;
    }

    //updates bomb timer and detonation stage
    update(){
        this.timer++;
        if(this.timer > (this.fireTime + this.detTime)){
            this.exploded = 2;
        }
        else if(this.timer > this.detTime){
            this.exploded = 1;
            app.stage.removeChild(this.circle);
        }   
    }
}

//sets key pressed indicators at key down
function onkeydown(ev) {
    switch (ev.key) {
        case "Enter":
            pressed['enter'] = true;
            break;
        //player 1
        case "a":
            lastPressed1= 'left';
            pressed1['left'] = true;
            break;

        case "d":
            lastPressed1= 'right';
            pressed1['right'] = true;
            break;

        case "w":
            lastPressed1 = 'up';
            pressed1['up'] = true;
            break;

        case "s":
            lastPressed1 = 'down';
            pressed1['down'] = true;
            break;
        case "e":
            pressed1['action'] = true;
            break;

        //player 2
        case "j":
            lastPressed2 = 'left';
            pressed2['left'] = true;
            break;

        case "l":
            lastPressed2 = 'right';
            pressed2['right'] = true;
            break;

        case "i":
            lastPressed2 = 'up';
            pressed2['up'] = true;
            break;

        case "k":
            lastPressed2 = 'down';
            pressed2['down'] = true;
            break;
        case "o":
            pressed2['action'] = true;
            break;

    }
}

//sets key pressed indicators at key down
function onkeyup(ev) {

    
    switch (ev.key) {
        case "Enter":
            pressed['enter'] = false;
            break;
        //player 1
        case "a": 
            pressed1['left'] = false;
            break;

        case "d": 
            pressed1['right'] = false;
            break;

        case "w":
            pressed1['up'] = false;
            break;

        case "s":
            pressed1['down'] = false;
            break;
        case "e":
            pressed1['action'] = false;
            break;

        //player 2 controls
        case "j": 
            pressed2['left'] = false;
            break;

        case "l": 
            pressed2['right'] = false;
            break;

        case "i":
            pressed2['up'] = false;
            break;

        case "k":
            pressed2['down'] = false;
            break;
        case "o":
            pressed2['action'] = false;
            break;
    }
}

//set key listeners for input
function setupControls() {
    window.addEventListener("keydown", onkeydown);
    window.addEventListener("keyup", onkeyup);
}

//movement logic
function processInput(){
    let collision;
    //player1
    if(lastMove1 != lastPressed1){
        if((pressed1['up'] || pressed1['down']) && (lastPressed1 == 'up' || lastPressed1 == 'down')){
            if(lastPressed1 == 'up'){
                if(map.getSpace(player1.getX(),player1.getY() - 1) > 10){
                    collision = true;
                }
                else{
                    collision = false;
                }
                player1.move('up',collision);
                lastMove1 = 'up';
            }
            if(lastPressed1 == 'down'){
                if(map.getSpace(player1.getX(),player1.getY() + 1) > 10){
                    collision = true;
                }
                else{
                    collision = false;
                }
                player1.move('down',collision);
                lastMove1 = 'down';
            }
        }
        else if(pressed1['left'] || pressed1['right']){
            if(lastPressed1 == 'left'){
                if(map.getSpace(player1.getX()-1,player1.getY()) > 10){
                    collision = true;
                }
                else{
                    collision = false;
                }
                player1.move('left',collision);
                lastMove1 = 'left';
            }
            if(lastPressed1 == 'right'){
                if(map.getSpace(player1.getX()+1,player1.getY()) > 10){
                    collision = true;
                }
                else{
                    collision = false;
                }
                player1.move('right',collision);
                lastMove1 = 'right';
            }
        } 
    } 
    else if(!pressed1['right'] && !pressed1['left'] && !pressed1['up'] && !pressed1['down']){
        lastMove1 = 'none';
    }

    //player2
    if(lastMove2 != lastPressed2){
        if((pressed2['up'] || pressed2['down']) && (lastPressed2 == 'up' || lastPressed2 == 'down')){
            if(lastPressed2 == 'up'){
                if(map.getSpace(player2.getX(),player2.getY() - 1) > 10){
                    collision = true;
                }
                else{
                    collision = false;
                }
                player2.move('up',collision);
                lastMove2 = 'up';
            }
            if(lastPressed2 == 'down'){
                if(map.getSpace(player2.getX(),player2.getY() + 1) > 10){
                    collision = true;
                }
                else{
                    collision = false;
                }
                player2.move('down',collision);
                lastMove2 = 'down';
            }
        }
        else if(pressed2['left'] || pressed2['right']){
            if(lastPressed2 == 'left'){
                if(map.getSpace(player2.getX()-1,player2.getY()) > 10){
                    collision = true;
                }
                else{
                    collision = false;
                }
                player2.move('left',collision);
                lastMove2 = 'left';
            }
            if(lastPressed2 == 'right'){
                if(map.getSpace(player2.getX()+1,player2.getY()) > 10){
                    collision = true;
                }
                else{
                    collision = false;
                }
                player2.move('right',collision);
                lastMove2 = 'right';
            }
        } 
    } 
    else if(!pressed2['right'] && !pressed2['left'] && !pressed2['up'] && !pressed2['down']){
        lastMove2 = 'none';
    }
}

//returns true if player is on death space, false otherwise
function checkHit(player){
    if(map.getSpace(player.getX(),player.getY()) == 1){
        return true;
    }
    else{
        return false;
    }
}

//main game loop
function gameLoop() {
    //start screen 
    if(!gameStart){
        screen.texture = PIXI.Texture.from('start.png');

        //start game on enter
        if(pressed['enter']){
            gameStart = true;
            app.stage.removeChild(screen); //remove start screen

            //generate game objects
            map = new Map();
            player1 = new Player('white',0,0);
            player2 = new Player('black',10,8);
            fire1 = new PIXI.Graphics();
            fire2 = new PIXI.Graphics();
        }
    }
    //past start screen
    else{
        //process movement
        processInput();

        //update player positions
        player1.update();
        player2.update();

        //check for bomb placed for both players
        if(pressed1['action'] && p1bomb == false){
            bomb1 = new Bomb(player1.getX(), player1.getY());
            map.setSpace(bomb1.getX(), bomb1.getY(), 12)
            p1bomb = true;
        }
        if(pressed2['action'] && p2bomb == false){
            bomb2 = new Bomb(player2.getX(), player2.getY());
            map.setSpace(bomb2.getX(), bomb2.getY(), 12)
            p2bomb = true;
        }
        
        //update both player bombs and trigger explosions
        if(p1bomb){
            bomb1.update() //update bomb timer

            //set fire
            if(bomb1.explode() == 1){ 
                fire1.clear()
                fire1.beginFill(0xf97e36);
                fire1.drawRect(0, 0, 96,96);
                
                map.setSpace(bomb1.getX(), bomb1.getY(), 1)
                //right
                if(map.getSpace(bomb1.getX()-1, bomb1.getY()) < 10){
                    map.setSpace(bomb1.getX()-1, bomb1.getY(), 1)
                    fire1.drawRect(96,0,96,96);
                }
                //left
                if(map.getSpace(bomb1.getX()+1, bomb1.getY()) < 10){
                    map.setSpace(bomb1.getX()+1, bomb1.getY(), 1)
                    fire1.drawRect(-96,0,96,96);
                }
                //up
                if(map.getSpace(bomb1.getX(), bomb1.getY()-1) < 10){
                    map.setSpace(bomb1.getX(), bomb1.getY()-1, 1)
                    fire1.drawRect(0,-96,96,96);
                }
                //down
                if(map.getSpace(bomb1.getX(), bomb1.getY()+1) < 10){
                    map.setSpace(bomb1.getX(), bomb1.getY()+1, 1)
                    fire1.drawRect(0,96,96,96);
                }
                fire1.x = bomb1.getX()*96;
                fire1.y = bomb1.getY()*96;
                fire1.endFill();
                app.stage.addChild(fire1);
            }

            //remove fire
            else if(bomb1.explode() == 2){
                app.stage.removeChild(fire1);
                map.setSpace(bomb1.getX(), bomb1.getY(), 0)
                if(map.getSpace(bomb1.getX()-1, bomb1.getY()) < 10){
                    map.setSpace(bomb1.getX()-1, bomb1.getY(), 0)
                }
                //left
                if(map.getSpace(bomb1.getX()+1, bomb1.getY()) < 10){
                    map.setSpace(bomb1.getX()+1, bomb1.getY(), 0);
                }
                //up
                if(map.getSpace(bomb1.getX(), bomb1.getY()-1) < 10){
                    map.setSpace(bomb1.getX(), bomb1.getY()-1, 0);
                }
                //down
                if(map.getSpace(bomb1.getX(), bomb1.getY()+1) < 10){
                    map.setSpace(bomb1.getX(), bomb1.getY()+1, 0);
                }
                p1bomb = false;
            }   
        }
        if(p2bomb){
            bomb2.update() //update bomb timer

            //set fire
            if(bomb2.explode() == 1){
                fire2.clear()
                fire2.beginFill(0xf97e36);
                fire2.drawRect(0, 0, 96,96);
                
                map.setSpace(bomb2.getX(), bomb2.getY(), 1)
                //right
                if(map.getSpace(bomb2.getX()+1, bomb2.getY()) < 10){
                    map.setSpace(bomb2.getX()+1, bomb2.getY(), 1)
                    fire2.drawRect(96,0,96,96);
                }
                //left
                if(map.getSpace(bomb2.getX()-1, bomb2.getY()) < 10){
                    map.setSpace(bomb2.getX()-1, bomb2.getY(), 1)
                    fire2.drawRect(-96,0,96,96);
                }
                //up
                if(map.getSpace(bomb2.getX(), bomb2.getY()-1) < 10){
                    map.setSpace(bomb2.getX(), bomb2.getY()-1, 1)
                    fire2.drawRect(0,-96,96,96);
                }
                //down
                if(map.getSpace(bomb2.getX(), bomb2.getY()+1) < 10){
                    map.setSpace(bomb2.getX(), bomb2.getY()+1, 1)
                    fire2.drawRect(0,96,96,96);
                }
                fire2.x = bomb2.getX()*96;
                fire2.y = bomb2.getY()*96;
                fire2.endFill();
                app.stage.addChild(fire2);
            }

            //remove fire
            else if(bomb2.explode() == 2){
                app.stage.removeChild(fire2);
                map.setSpace(bomb2.getX(), bomb2.getY(), 0)
                if(map.getSpace(bomb2.getX()-1, bomb2.getY()) < 10){
                    map.setSpace(bomb2.getX()-1, bomb2.getY(), 0)
                }
                //left
                if(map.getSpace(bomb2.getX()+1, bomb2.getY()) < 10){
                    map.setSpace(bomb2.getX()+1, bomb2.getY(), 0);
                }
                //up
                if(map.getSpace(bomb2.getX(), bomb2.getY()-1) < 10){
                    map.setSpace(bomb2.getX(), bomb2.getY()-1, 0);
                }
                //down
                if(map.getSpace(bomb2.getX(), bomb2.getY()+1) < 10){
                    map.setSpace(bomb2.getX(), bomb2.getY()+1, 0);
                }
                p2bomb = false;
            }    
        }

        //check for player hit
        if(checkHit(player1)){
            player1.kill();
        }
        if (checkHit(player2)){
            player2.kill();
        }

        //check win condition
        if(!done){
            if(!player1.isAlive() || !player2.isAlive()){
                done = true;
                app.stage.addChild(screen); //render end screen

                //check for winner and set corresponding end screen
                if(!player1.isAlive() && !player2.isAlive()){
                    screen.texture = PIXI.Texture.from('end3.png');
                }
                else if(!player1.isAlive()){
                    screen.texture = PIXI.Texture.from('end2.png');
                }
                else{
                    screen.texture = PIXI.Texture.from('end1.png');
                }
            }
        }
        else{ //when game is done reset game on enter
            if(pressed['enter']){
                app.stage.removeChild(screen);
                player1.reset();
                player2.reset();
                done = false;
            }
        }
    }
}

//---
// Create the application helper and add its render target to the page
app = new PIXI.Application({ width: 1056, height: 864 });
document.body.appendChild(app.view);

//render background
background = PIXI.Sprite.from('bombmap.png');
app.stage.addChild(background);

//render start screen
screen = PIXI.Sprite.from('start.png');
app.stage.addChild(screen);

//setup key listeners
setupControls();

//start gameloop at 60fps
setInterval(gameLoop, 1000/60);



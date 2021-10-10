/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', Event_OnDeviceReady, false);

//#region Enums
const GameState= {
    INIT: 0,
    START_SCREEN: 1,
    GAME_OVER: 2,
    GAME: 3,
    }
//#endregion

//#region Game Balance Values
const cDefaultScreenWidth = 800;
const cDefaultScreenHeight = 480;
const cVerticalPipeDistance = 500;
const cVerticalPipeVariance = 200;
const cVerticalPipeOffset = -100;
const cHorizontalPipeDistance = 300;
const cHorizontalPipeStartOffset = 500;
const cScrollSpeed = 2;
const cBirdJumpVelocity = 200;
const cBirdGravity = 300;
const cBirdVerticalOffset = 100;

const cBackgroundHeight = 228;
const cGroundHeight = 112;
const cScoreWidth = 14;
const cScoreSpacing = 2;
//#endregion

//#region Game State Values
var Game;
var Scene;
var FlappyGame;
var PlayerScore = 0;
var CurrentGameState = GameState.INIT;
//#endregion

//#region Classes
function Pipe()
{
    this.TopPipe;
    this.BottomPipe;
    this.XPosition = 0;
    this.YPosition = 0;

    this.SetY = function(y)
    {
        this.yPos = y;
        this.TopPipe.setY(y - cVerticalPipeDistance / 2);
        this.BottomPipe.setY(y + cVerticalPipeDistance / 2);
    }
    this.MoveX = function(x)
    {
        this.XPosition = this.XPosition - x;
        this.TopPipe.setX(this.XPosition);
        this.BottomPipe.setX(this.XPosition);
    }
    this.SetX = function(x)
    {
        this.XPosition = x;
        this.TopPipe.setX(this.XPosition);
        this.BottomPipe.setX(this.XPosition);
    }
}

function Flappy()
{
    this.Background;
    this.Floor;
    this.Bird;
    this.Pipes = [];
    this.PlayerScoreSprites = [];

    this.StartButton;
}
//#endregion

//#region Helper
function GetRandomPipeHeight()
{
    return (cDefaultScreenHeight / 2) + ((Math.random() - 0.5) * cVerticalPipeVariance) + cVerticalPipeOffset;
}
//#endregion

//#region Game
function CreateGame()
{
    var config = {
        type: Phaser.AUTO,
        parent: 'flappy-game',
        backgroundColor: '#70c5ce',
        scale: {
            mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
            parent: 'flappy-game',
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: cDefaultScreenWidth,
            height: cDefaultScreenHeight
        },
        physics: {
          default: 'arcade',
          arcade: {
              debug: false,
              gravity: { y: 0 },
              fixedStep: true
          }
          },
        scene: {
            preload: Preload,
            create: Create,
            update: Update,
        }
    };
    
    Game = new Phaser.Game(config);
    FlappyGame = new Flappy();
}

function Preload()
{
    this.load.atlasXML('sheet', 'img/sheet.png', 'img/sheet.xml');
}

function Create()
{
    Scene = this;

    Game.anims.create({
        key: 'bird',
        repeat: -1,
        frameRate: 10,
        frames: Game.anims.generateFrameNames('sheet', { start: 1,  end: 3, prefix: 'bird_', suffix: '.png' })
    });

    FlappyGame.Background = Scene.add.tileSprite(0, cDefaultScreenHeight - cBackgroundHeight, cDefaultScreenWidth, cBackgroundHeight, 'sheet', 'background.png')
        .setOrigin(0);
    
    for(var i = 0; i < (cDefaultScreenWidth / cHorizontalPipeDistance); i++)
    {
        FlappyGame.Pipes.push(new Pipe());

        FlappyGame.Pipes[i].TopPipe = Scene.add.sprite(cDefaultScreenWidth / 2, cDefaultScreenHeight / 2, 'sheet', 'pipe_south.png');
        FlappyGame.Pipes[i].BottomPipe = Scene.add.sprite(cDefaultScreenWidth / 2, cDefaultScreenHeight / 2, 'sheet', 'pipe_north.png');

        FlappyGame.Pipes[i].SetY(GetRandomPipeHeight());
        FlappyGame.Pipes[i].SetX(cDefaultScreenWidth + cHorizontalPipeDistance * i + cHorizontalPipeStartOffset);

        Scene.physics.add.existing(FlappyGame.Pipes[i].TopPipe, false);
        Scene.physics.add.existing(FlappyGame.Pipes[i].BottomPipe, false);

        FlappyGame.Pipes[i].TopPipe.body.setAllowGravity(false);
        FlappyGame.Pipes[i].BottomPipe.body.setAllowGravity(false);

        FlappyGame.Pipes[i].TopPipe.body.setImmovable();
        FlappyGame.Pipes[i].BottomPipe.body.setImmovable();
    }
    
    FlappyGame.Bird = Scene.physics.add.sprite(cDefaultScreenWidth / 2, cDefaultScreenHeight / 2 - cBirdVerticalOffset, 'sheet')
        .play('bird');
    FlappyGame.Bird.setCollideWorldBounds(true);
    FlappyGame.Bird.setGravityY(0);

    FlappyGame.Ground = Scene.add.tileSprite(0, cDefaultScreenHeight - cGroundHeight, cDefaultScreenWidth, cGroundHeight, 'sheet', 'ground.png')
        .setOrigin(0);
    Scene.physics.add.existing(FlappyGame.Ground, true);

    Scene.physics.add.collider(
        FlappyGame.Bird,
        FlappyGame.Ground,
        Event_OnPlayerCollission
    );

    FlappyGame.Pipes.forEach(pipe =>
    {
        Scene.physics.add.overlap(
            FlappyGame.Bird,
            pipe.TopPipe,
            Event_OnPlayerCollission
        );
        Scene.physics.add.overlap(
            FlappyGame.Bird,
            pipe.BottomPipe,
            Event_OnPlayerCollission
        );
    });

    FlappyGame.StartButton = Scene.add.sprite(cDefaultScreenWidth / 2, cDefaultScreenHeight / 2, 'sheet', 'button_start.png')
        .setInteractive()
        .on('pointerdown', () => UpdateGameState(GameState.GAME) );

    UpdateGameState(GameState.INIT);
    UpdateGameState(GameState.START_SCREEN);
}

function Update()
{
    switch(CurrentGameState)
    {
        case GameState.START_SCREEN:
            UpdateStartScreen();
            break;
        case GameState.GAME_OVER:
            UpdateGameOver();
            break;
        case GameState.GAME:
            UpdateGame();
            break;

        default:
            break;
    }
}
//#endregion

//#region Updates
function UpdateStartScreen()
{

}

function UpdateGameOver()
{

}

function UpdateGame()
{
    ScrollUpdate();
}

function ScrollUpdate()
{
    // Update Background and ground
    FlappyGame.Background.tilePositionX += (cScrollSpeed / 2);
    FlappyGame.Ground.tilePositionX += cScrollSpeed;

    // Update position of each pipe
    // When pipe is outside screen -> teleport to opposite side
    // When pipe crosses middle of screen -> update score
    var score = PlayerScore;
    FlappyGame.Pipes.forEach(pipe =>
    {
        var oldPos = pipe.XPosition;
        pipe.MoveX(cScrollSpeed);

        // Pipe is outside screen
        if(pipe.XPosition < -50)
        {
            pipe.SetX(cDefaultScreenWidth + 50);
            pipe.SetY(GetRandomPipeHeight());
        }
        // Pipe crossed middle of screen
        else if(oldPos > (cDefaultScreenWidth / 2)
            && pipe.XPosition <= (cDefaultScreenWidth / 2))
        {
            score++;
        }
    });
    if(score != PlayerScore)
    {
        PlayerScore = score;
        UpdateScore();
    }
}

function UpdateScore()
{
    for(var i = 0; i < FlappyGame.PlayerScoreSprites.length; i++)
    {
        FlappyGame.PlayerScoreSprites[i].destroy(true);
    }
    FlappyGame.PlayerScoreSprites = [];

    var scoreAsText = "" + PlayerScore;
    var completeScoreLength = (scoreAsText.length * cScoreWidth) + ((scoreAsText.length - 1) * cScoreSpacing);
    for (var i = 0; i < scoreAsText.length; i++)
    {
        FlappyGame.PlayerScoreSprites.push();
        var xPos = cDefaultScreenWidth / 2 - (completeScoreLength / 2) + (cScoreWidth * i) + (cScoreSpacing * i);
        FlappyGame.PlayerScoreSprites[i] = Scene.add.sprite(xPos, 50, 'sheet', 'number_b_' + scoreAsText.charAt(i) + '.png');
    }
}
//#endregion

//#region GameState Update
function UpdateGameState(newGamestate)
{
    CurrentGameState = newGamestate;
    switch(CurrentGameState)
    {
        case GameState.INIT:
            OnInit();
            break;
        case GameState.START_SCREEN:
            OnStartScreen();
            break;
        case GameState.GAME_OVER:
            OnGameOver();
            break;
        case GameState.GAME:
            OnGame();
            break;

        default:
            break;
    }
}

function OnInit()
{

}

function OnStartScreen()
{
    FlappyGame.StartButton.visible = true;
}

function OnGameOver()
{
    FlappyGame.StartButton.visible = true;
    Scene.cameras.main.flash();
    
    window.removeEventListener('mousedown', Event_OnClickOrTap);
    window.removeEventListener('touchstart', Event_OnClickOrTap);
}

function OnGame()
{
    FlappyGame.StartButton.visible = false;
    FlappyGame.Bird.setGravityY(cBirdGravity);

    var i = 0;
    FlappyGame.Pipes.forEach(pipe =>
    {
        pipe.SetY(GetRandomPipeHeight());
        pipe.SetX(cDefaultScreenWidth + cHorizontalPipeDistance * i + cHorizontalPipeStartOffset);
        i += 1;
    });
    FlappyGame.Bird.setY(cDefaultScreenHeight / 2 - cBirdVerticalOffset);
    PlayerScore = 0;
    UpdateScore();

    window.addEventListener('mousedown', Event_OnClickOrTap);
    window.addEventListener('touchstart', Event_OnClickOrTap);
}
//#endregion

//#region Events
function Event_OnDeviceReady()
{
    CreateGame();
}

function Event_OnPlayerCollission()
{
    if(CurrentGameState == GameState.GAME)
    {
        UpdateGameState(GameState.GAME_OVER);
    }
}

function Event_OnClickOrTap()
{
    FlappyGame.Bird.setVelocity(0, -cBirdJumpVelocity);
}
//#endregion
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
document.addEventListener('deviceready', onDeviceReady, false);

var width = 800;
var height = 600;
var pipeDistance = 500;
var pipeHorDistance = 300;

function Pipe() {
    this.Top;
    this.Bottom;

    this.SetY = function(y){
        this.Top.setY(y - pipeDistance / 2);
        this.Bottom.setY(y + pipeDistance / 2);
        console.log("Set");
    }
    this.MoveX = function(x) {
        this.Top.setX(this.Top.x - x);
        this.Bottom.setX(this.Bottom.x - x);
        console.log("move");
    };
    this.SetX = function(x) {
        this.Top.setX(x);
        this.Bottom.setX(x);
        console.log("move");
    };
}

function onDeviceReady() {
    var config = {
      type: Phaser.WEBGL,
      parent: 'flappy-game',
      scale: {
          mode: Phaser.Scale.FIT,
          parent: 'flappy-game',
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: width,
          height: height
      },
      physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 150 }
        }
        },
      scene: {
          preload: preload,
          create: create,
          update: update,
      }
    };
  
    var game = new Phaser.Game(config);
    var ground;
    var bird;
    var bg;
    var pipes = [];

    function preload() {
        this.load.atlasXML('sheet', 'img/sheet.png', 'img/sheet.xml');
    }

    function create() {
        // window.addEventListener('resize', resize);
        window.addEventListener('mousedown', touch);
        window.addEventListener('touchstart', touch);

        game.anims.create({
            key: 'bird',
            repeat: -1,
            frameRate: 10,
            frames: this.anims.generateFrameNames('sheet', { start: 1,  end: 3, prefix: 'bird_', suffix: '.png' })
        });

        bg = this.add.tileSprite(0, height - 228, width, 228, 'sheet', 'background.png').setOrigin(0);
        bg.setScrollFactor(1, 0);
        ground = this.add.tileSprite(0, height - 112, width, 112, 'sheet', 'ground.png').setOrigin(0);
        ground.setScrollFactor(2, 0);
        this.physics.add.existing(ground, true);
        bird = this.physics.add.sprite(width / 2, height / 2, 'sheet').setOrigin(0).play('bird');
        bird.setCollideWorldBounds(true);

        for(var i = 0; i < 5; i++)
        {
            pipes.push(new Pipe());

            pipes[i].Top = this.add.sprite(width / 2, height / 2, 'sheet', 'pipe_south.png');
            pipes[i].Bottom = this.add.sprite(width / 2, height / 2, 'sheet', 'pipe_north.png');
            pipes[i].SetY(height / 2);
            pipes[i].SetX(width + pipeHorDistance * i);
            this.physics.add.existing(pipes[i].Top, false);
            this.physics.add.existing(pipes[i].Bottom, false);
            pipes[i].Top.body.setAllowGravity(false);
            pipes[i].Bottom.body.setAllowGravity(false);
        }

        // resize();
    }
  
    function update() {
        this.physics.world.collide(
            bird,
            ground,
            playerCollide,
            null,
            this);
        bg.tilePositionX += 1;
        ground.tilePositionX += 2;
        updatePipes();
    }

    function playerCollide()
    {
        console.log("collide");
    }
  
    function updatePipes()
    {
        pipes.forEach(pipe => {
            pipe.MoveX(5);
            if(pipe.Top.x < -50)
            {
                pipe.SetX(width + 50);
                pipe.SetY(height / 2 + (Math.random() - 0.5) * 300);
            }
        });
    }

    function touch()
    {
        bird.setVelocity(0, -150);
    }

    // function resize() {
    //     var canvas = game.canvas, width = window.innerWidth, height = window.innerHeight;
    //     var wratio = width / height, ratio = canvas.width / canvas.height;
   
    //     canvas.style.width = width + "px";
    //     canvas.style.width = height + "px";

    //   if (wratio < ratio) {
    //       canvas.style.width = width + "px";
    //       canvas.style.height = (width / ratio) + "px";
    //   } else {
    //       canvas.style.width = (height * ratio) + "px";
    //       canvas.style.height = height + "px";
    //   }
//   }
}
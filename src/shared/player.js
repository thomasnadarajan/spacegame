import {ship} from '../shared/ship'
export class player {
    constructor(user, parentShip, x, y, pair) {
        this.user = user
        // Store only the ship ID, not the entire ship object
        this.parentShip = typeof parentShip === 'object' ? parentShip.id : parentShip
        // Store only the ship ID
        this.currentShip = typeof parentShip === 'object' ? parentShip.id : parentShip
        
        // Calculate initial position based on ship block size if ship object provided
        const shipBlock = parentShip.shipblock || 40 // Default block size if not provided
        
        this.playerView = true
        this.position = {
            x: x,
            y: y
        }
        this.width = 25
        this.height = 25
        
        // Calculate world position if ship object provided
        this.worldPosition = {
            x: (this.position.x * shipBlock) - this.width / 2 + shipBlock / 2,
            y: (this.position.y * shipBlock) - this.height / 2 + shipBlock / 2
        }
        
        this.rotation = 0
        this.pair = pair
        this.direction = 0
        this.animation = 0
        this.weaponsDirection = 0
        this.health = 100
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            use: false
        }
    }
    
    moveShip(shipid, x, y) {
        this.currentShip = parseInt(shipid)
        this.position.x = x
        this.position.y = y
        this.worldPosition.x = (this.position.x * ship.block) -this.width / 2  + ship.block / 2
        this.worldPosition.y = (this.position.y * ship.block) -this.height / 2 + ship.block / 2
    }
    // New method to explicitly update worldPosition based on grid position
    updateWorldPosition(shipBlockSize) {
        const block = shipBlockSize || 40;
        this.worldPosition = { 
            x: this.position.x * block + block / 2 - this.width / 2, 
            y: this.position.y * block + block / 2 - this.height / 2 
        };
        console.log(`Updated worldPosition based on grid [${this.position.x},${this.position.y}]:`, this.worldPosition);
    }

    movePlayer(targetWorldX, targetWorldY, cargo_grid, shipBlockSize) {
        const block = shipBlockSize || 40;

        // Calculate target grid coordinates
        const targetGridX = Math.floor(targetWorldX / block);
        const targetGridY = Math.floor(targetWorldY / block);
        
        // Check grid bounds (0-9)
        if (targetGridX < 0 || targetGridX > 9 || targetGridY < 0 || targetGridY > 9) {
            console.log('Target grid position out of bounds');
            return false; // Cannot move
        }
        // Block movement if target cell is a ship wall (static grid value 0)
        if (ship.grid[targetGridX][targetGridY] === 0) {
            console.log(`Movement blocked by ship wall at [${targetGridX},${targetGridY}]`);
            return false; // Wall blocking
        }
        // Block movement if there's cargo in the cell
        if (cargo_grid && cargo_grid[targetGridX] && cargo_grid[targetGridX][targetGridY] === 1) {
            console.log(`Movement blocked by cargo at [${targetGridX},${targetGridY}]`);
            return false; // Cargo blocking
        }
        
        // TEMPORARILY ASSUME PLAYER CAN ALWAYS MOVE IF NOT blocked
        let canMove = true;
        console.log(`Temp Check: Target Grid [${targetGridX}, ${targetGridY}], canMove = ${canMove}`);

        // --- Original Cargo Check (Commented out for testing) ---
        // if (cargo_grid) {
        //     try {
        //         if (cargo_grid[targetGridX][targetGridY] === 1) {
        //             console.log(`Movement blocked by cargo at [${targetGridX}, ${targetGridY}]`);
        //             canMove = false;
        //         }
        //     } catch (error) {
        //         console.error(`Error checking cargo grid at [${targetGridX}, ${targetGridY}]:`, error);
        //         // Decide if error blocks movement or not - let's block for safety
        //         // canMove = false; 
        //     }
        // }
        // --- End Collision Check ---

        // If movement is allowed, update grid position ONLY
        if (canMove) {
            // Update worldPosition regardless of grid change
            this.worldPosition = { x: targetWorldX, y: targetWorldY };

            // Only update grid if it changed
            if (this.position.x !== targetGridX || this.position.y !== targetGridY) {
                console.log(`Player moving from grid [${this.position.x},${this.position.y}] to [${targetGridX},${targetGridY}]`);
                this.position.x = targetGridX;
                this.position.y = targetGridY;
            }
            
            return true;
        } else {
            console.log('Movement blocked (Simplified Check).');
            return false;
        }
    }
    togglePlayerView() {
        this.playerView = !this.playerView
    }
    hit() {
        this.health-=10;
        if (this.health <= 0) {
            this.health = 0
        }
    }
    update(cargo_grid, shipBlockSize) {
        const block = shipBlockSize || 40;
        let moved = false; // Track if player moved this update
        let targetWorldX = this.worldPosition.x;
        let targetWorldY = this.worldPosition.y;

        // Only process movement if not in pilot mode
        if (this.playerView) {
            // Calculate target world position based on keys
            if (this.keys.left) {
                targetWorldX -= 4;
                if (this.direction !== 1) { this.direction = 1; this.animation = 0; }
            }
            else if (this.keys.right) {
                targetWorldX += 4;
                if (this.direction !== 3) { this.direction = 3; this.animation = 0; }
            }
            else if (this.keys.up) {
                targetWorldY -= 4;
                if (this.direction !== 0) { this.direction = 0; this.animation = 0; }
            }
            else if (this.keys.down) {
                targetWorldY += 4;
                if (this.direction !== 2) { this.direction = 2; this.animation = 0; }
            }

            // Attempt to move to the target world position
            // movePlayer now returns true if grid position changed, false otherwise
            if (targetWorldX !== this.worldPosition.x || targetWorldY !== this.worldPosition.y) {
                moved = this.movePlayer(targetWorldX, targetWorldY, cargo_grid, block);
            }

            // Update animation only if a move key is pressed
            // And optionally only if the move was successful (moved == true)
            if (this.keys.left || this.keys.right || this.keys.up || this.keys.down) {
                this.animation = this.animation < 3.8 ? this.animation + 0.2 : 0;
            }
            else {
                this.animation = 0; // Reset animation if no movement keys are pressed
            }
        } else {
            // Reset animation when in pilot mode
            this.animation = 0;
        }
    }
}
import * as path from './path';
import * as box from './box';
import * as creature from './creature';
import {newLocation} from './world';
import {randomInt} from 'random-tools';


/**
 * transfer an item from one thing to another
 * e.g. box to player, player to player, creature to player
 *
 * @param from
 * @param to
 * @param id
 * @returns {boolean}
 */
export const itemTransfer = (from, to, id) => {

    const foundItem = from.items.list('id', id);

    // [from] has item
    if(!foundItem.length){
        return {
            success: false,
            error: 'item unavailable'
        };
    }

    // get first found item
    const item = foundItem[0];

    // check if [from] has open property
    // if from.open is false return false
    if('open' in from &&
        !from.open.get()) {

        return {
            success: false,
            error: 'from open'
        };
    }

    // check if [to] has open property
    // if to.open is false return false
    if('open' in to &&
        !to.open.get()) {

        return {
            success: false,
            error: 'to open'
        };
    }

    // check if [to] and [item] has rank property
    // if [to]s rank is not high enougth return a fail
    if('rank' in to &&
        'rank' in item &&
        to.rank.get() < item.rank.get()) {

        return {
            success: false,
            error: 'rank'
        };
    }

    // check if [to] and [item] has slots property
    // if [to] has not enougth slots free return a fail
    if('slots' in to &&
        'slots' in item &&
        to.slots.free() < item.slots.get()) {

        return {
            success: false,
            error: 'slots'
        };
    }

    // add item to [to]s item list
    to.items.add(item);

    // check if [to] has the item now
    // then remove it from [from]s item list
    if(to.items.list('id', id).length) {
        from.items.remove(id);
        return {
            success: true
        };
    }
    else {
        return {
            success: false,
            error: 'unknown'
        };
    }
};

/**
 * get average dexterity of items in box
 * when player has higher dexterity as 75% of average item dexterity
 */
export const openBox = (box, player) => {

    const items = box.summary.items.get(),
        boxDexterity = (items.reduce((dex, item) => dex + item.dexterity, 0) / items.length) * .95;
    let canOpen = player.dexterity.get() >= boxDexterity;

    // always open when box is already open
    if(box.open.get()) {
        canOpen = true;
    }

    box.open.set(canOpen);

    if(canOpen) {
        return {
            success: true
        };
    }
    else {
        return {
            success: false,
            error: 'dexterity'
        }
    }
};


export const openDoor = ({door, player, place}) => {

    let canOpen = true; // ToDo: add conditions here

    if(door.open.get()) {
        canOpen = true;
    }

    door.open.set(canOpen);

    if(!door.path.get()){
        door.path.set(path.createPath({
                currentPlace: place
            }));
    }

    if(canOpen) {
        return {
            success: true
        };
    }
    else {
        return {
            success: false,
            error: 'unknown'
        }
    }
};

export const leave = ({door, group, place, world}) => {

    const foundPlace = door.path.get()
                        .places.list()
                        .filter(x => x.name.get() !== place.name.get());

    const numberOfBoxes = randomInt(7, 1);
    const numberOfCreatures = randomInt(6, 1);

    const newPlace = foundPlace[0];

    if(!newPlace.location.get()) {
        newPlace.location.set(newLocation(world, place.location.get()));
    }

    const location = newPlace.location.get();

    if(!newPlace.boxes.list().length) {
        newPlace.boxes.add(box.createBoxes({
            average: group.info.average()
        }, numberOfBoxes));
    }

    if(!newPlace.creatures.list().length) {
        newPlace.creatures.add(creature.createCreatures({
            average: group.info.average()
        }, numberOfCreatures));
    }

    newPlace.groups.add(group);
    newPlace.location.set(location);
    world.places[location] = newPlace;
    world.currentPlace = location;

    place.groups.remove(group.id.get());

    return {
        success: true
    };
};

export const attack = ({attacker, defender, weapon, armor}) => {

    let power = attacker.attack.get(),
        defense = defender.defense.get();

    if (weapon) {
        power += weapon.attack.get();
    }

    if (armor) {
        defense += armor.defense.get();
    }

    console.log('power', power);
    console.log('defense', defense);

    if (power > defense) {
        defender.health.down(power - defense);

        return {
            success: true,
            data: {
                power,
                defense
            }
        };
    } else {
        if (armor) {
            attacker.health.down(armor.attack.get());
        }

        return {
            success: false,
            data: {
                power,
                defense
            },
            error: 'defended'
        }
    }
};

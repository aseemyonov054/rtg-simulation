
const _rndBuf = new Uint32Array(1);
function randInt(max) {
    crypto.getRandomValues(_rndBuf);
    return _rndBuf[0] % max;
}

function generate_stack(sec_num, row_num, tier_num){
    // function generates random stack
    var stack = [];
    var height;
    for(let k = 0; k < sec_num; k++){
        var var_row = [];
        for(let i = 0; i < row_num; i++){
            height = randInt(tier_num);
            var var_tier = {"total_num" : height, "conts" : [], "meshs" : [], "color" : []};
            for(let j = 0; j < height; j++){
                var_tier.conts.push(1);
                var_tier.meshs.push("-");
                var_tier.color.push("-");
            }
            /*while(height < tier_num){
                var_tier.conts.push(0);
                var_tier.meshs.push("-");
                var_tier.color.push("-");
                height++;
            }*/
            var_row.push(var_tier);
        }
        stack.push(var_row);
    }
    return stack;
}

function generate_tasks(stack, num_of_tasks, rtg_element, rtg){
    var total_containers = 0;
    for(let k = 0; k < stack.length; k++){
        for(let i = 0; i < stack[k].length; i++){
            total_containers += stack[k][i].total_num;
        }
    }
    if(total_containers === 0) return [];

    var list_of_tasks = [];
    var rand_s;
    var rand_r;
    var rand_t;
    var rtg_current_position = Math.floor(rtg_element.model.position.x / 12.3);
    var min_pos = 0;
    var max_pos = stack.length;
    rtg.forEach(element => {
        if(element != rtg_element){
            var var_pos = Math.floor(element.model.position.x / 12.3);
            if(var_pos > min_pos && var_pos < rtg_current_position){
                min_pos = var_pos;
            }
            if(var_pos < max_pos && var_pos > rtg_current_position){
                max_pos = var_pos;
            }
            if(element.list_of_actions.length > 0){
                var next_pos = Math.floor(element.list_of_actions[0][0] / 12.3);
                if(next_pos > min_pos && next_pos < rtg_current_position){
                    min_pos = next_pos;
                }
                if(next_pos < max_pos && next_pos > rtg_current_position){
                    max_pos = next_pos;
                }
            }
        }
    });
    while(list_of_tasks.length < num_of_tasks){
        rand_s = randInt(stack.length);
        rand_r = randInt(stack[rand_s].length);
        rand_t = randInt(stack[rand_s][rand_r].total_num);
        var counter = 0;
        while(stack[rand_s][rand_r].total_num === 0 || rand_s < min_pos || rand_s > max_pos){
            rand_s = randInt(stack.length);
            rand_r = randInt(stack[rand_s].length);
            rand_t = randInt(stack[rand_s][rand_r].total_num);
            //console.log(stack[rand_s][rand_r].total_num === 0);
            counter++;
            if(counter > 20){
                break;
            }
        }
        list_of_tasks.push(
            [rand_s, rand_r, rand_t]
        );
    }
    return list_of_tasks;
}

function find_next_pos(stack, task){
    var goal_s = task[0];
    // find minimum position
    var min_height = 1000000;
    var min_row = 0;
    for(let r = 0; r < stack[task[0]].length; r++){
        if(stack[task[0]][r].total_num < min_height){
            min_height = stack[task[0]][r].total_num;
            min_row = r;
        }
    }
    var next_pos = [goal_s, min_row, min_height];
    return next_pos;
}

function generate_moves(stack, task){
    // function generates moves to load containers
    var next_pos;
    // default position
    var default_r = 10;
    var default_t = 7;
    var load_r = 10;
    var load_t = 0;
    // goal position
    var goal_s = task[0];
    var goal_r = task[1];
    var goal_t = task[2];
    var current_section = stack[goal_s];
    // moves format: section, row, tier, move_type ("no_cont", "with_cont")
    var moves = [];
    if(stack[goal_s][goal_r].total_num === goal_t+1){
        moves.push([goal_s, goal_r, default_t, "no_cont", "-", undefined, "-"]);
        moves.push([goal_s, goal_r, goal_t, "no_cont", "-", stack[goal_s][goal_r].meshs[goal_t], stack[goal_s][goal_r].color[stack[goal_s][goal_r].color.length-1]]);
        moves.push([goal_s, goal_r, default_t, "with_cont", "-", undefined, "-"]);
        moves.push([goal_s, load_r, default_t, "with_cont", "-", undefined, "-"]);
        moves.push([goal_s, load_r, load_t, "with_cont", "-", undefined, "-"]);
        moves.push([goal_s, default_r, default_t, "no_cont", "remove_cont", stack[goal_s][goal_r].meshs[goal_t], "-"]);
        
        stack[goal_s][goal_r].conts.pop();
        stack[goal_s][goal_r].meshs.pop();
        stack[goal_s][goal_r].color.pop();
        stack[goal_s][goal_r].total_num = stack[goal_s][goal_r].meshs.length;
    }else{
        while(stack[goal_s][goal_r].meshs.length > goal_t+1){
            next_pos = find_next_pos(stack, task);
            moves.push([goal_s, goal_r, stack[goal_s][goal_r].meshs.length-1, "no_cont", "-", stack[goal_s][goal_r].meshs[stack[goal_s][goal_r].meshs.length-1], 
            stack[goal_s][goal_r].color[stack[goal_s][goal_r].color.length-1]]);
            moves.push([goal_s, goal_r, default_t, "with_cont", "-", undefined, "-"]);
            moves.push([goal_s, next_pos[1], default_t, "with_cont", "-", undefined, "-"]);
            moves.push([goal_s, next_pos[1], next_pos[2], "with_cont", "-", undefined, "-"]);
            moves.push([goal_s, next_pos[1], default_t, "no_cont", "-", undefined, "-"]);
            moves.push([goal_s, goal_r, default_t, "no_cont", "-", undefined, "-"]);

            stack[goal_s][next_pos[1]].conts.push(1);
            stack[goal_s][next_pos[1]].meshs.push(stack[goal_s][goal_r].meshs[stack[goal_s][goal_r].meshs.length-1]);
            stack[goal_s][next_pos[1]].color.push(stack[goal_s][goal_r].color[stack[goal_s][goal_r].meshs.length-1]);
            stack[goal_s][next_pos[1]].total_num = stack[goal_s][next_pos[1]].meshs.length;

            stack[goal_s][goal_r].meshs.pop();
            stack[goal_s][goal_r].color.pop();
            stack[goal_s][goal_r].conts.pop();
            stack[goal_s][goal_r].total_num = stack[goal_s][goal_r].meshs.length;
        }
        moves.push([goal_s, goal_r, default_t, "no_cont", "-", "-"]);
        moves.push([goal_s, goal_r, goal_t, "no_cont", "-", stack[goal_s][goal_r].meshs[stack[goal_s][goal_r].meshs.length-1]]);
        moves.push([goal_s, goal_r, default_t, "with_cont", "-", "-"]);
        moves.push([goal_s, load_r, default_t, "with_cont", "-", "-"]);
        moves.push([goal_s, load_r, load_t, "with_cont", "-", "-"]);
        moves.push([goal_s, default_r, default_t, "no_cont", "remove_cont", stack[goal_s][goal_r].meshs[stack[goal_s][goal_r].meshs.length-1]]);
        stack[goal_s][goal_r].conts.pop();
        stack[goal_s][goal_r].meshs.pop();
        stack[goal_s][goal_r].color.pop();
        stack[goal_s][goal_r].total_num = stack[goal_s][goal_r].meshs.length;
    }
    return moves;
}

export {  
    generate_stack,
    generate_tasks,
    generate_moves
};
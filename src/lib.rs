use serde::{Deserialize, Serialize};
use shogi_core::{Move, Position};
use shogi_official_kifu::display_single_move_kansuji;
use shogi_usi_parser::FromUsi;
use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

const EXAMPLE_SFEN: &str = "9/4k4/9/4P4/9/9/9/9/9 b 2G2r2b2g4s4n4l17p 1";

type Branches = Vec<BranchEntry>;

#[derive(Serialize, Deserialize)]
struct BranchEntry {
    moves: Vec<JsMove>,
    possible_next_moves: Vec<JsMove>,
    eval: Option<Eval>,
}

#[derive(Serialize, Deserialize, Clone)]
struct JsMove {
    usi: String,
    official_kifu: String,
}

#[derive(Serialize, Deserialize, Clone, Copy)]
struct Eval {
    num_moves: i32,
    pieces: i32,
    futile: i32,
}

fn example_branches() -> Branches {
    // translated from solve.ts
    let s = "sfen ".to_string() + &EXAMPLE_SFEN;
    let pos = Position::from_usi(&s).unwrap();
    let get_move = |mvs_usi: &[&str]| {
        let mut pos = pos.clone();
        let n = mvs_usi.len();
        for i in 0..n - 1 {
            let mv = Move::from_usi(mvs_usi[i]).unwrap();
            pos.make_move(mv).unwrap();
        }
        let mv = Move::from_usi(mvs_usi[n - 1]).unwrap();
        let official_kifu = display_single_move_kansuji(pos.inner(), mv).unwrap();

        JsMove {
            usi: mvs_usi[n - 1].to_string(),
            official_kifu,
        }
    };

    let move0 = get_move(&["G*5c"]);
    let move00 = get_move(&["G*5c","5b6a"]);
    let move01 = get_move(&["G*5c","5b5a"]);
    let move02 = get_move(&["G*5c","5b4a"]);
    let move000 = get_move(&["G*5c","5b6a","G*6b"]);
    let move010 = get_move(&["G*5c","5b5a","G*5b"]);
    let move020 = get_move(&["G*5c","5b4a","G*4b"]);

    let mate_eval = Eval {
        num_moves: 0,
        pieces: 0,
        futile: 0,
    };
    let one_eval = Eval {
        num_moves: 1,
        pieces: 1,
        futile: 0,
    };
    let branches = vec![
        BranchEntry {
            moves: vec![],
            possible_next_moves: vec![move0.clone()],
            eval: Some(Eval {
                num_moves: 3,
                pieces: 2,
                futile: 0,
            }),
        },
        BranchEntry {
            moves: vec![move0.clone()],
            possible_next_moves: vec![move00.clone(), move01.clone(), move02.clone()],
            eval: Some(Eval {
                num_moves: 2,
                pieces: 1,
                futile: 0,
            }),
        },
        BranchEntry {
            moves: vec![move0.clone(), move00.clone()],
            possible_next_moves: vec![move000.clone()],
            eval: Some(one_eval),
        },
        BranchEntry {
            moves: vec![move0.clone(), move01.clone()],
            possible_next_moves: vec![move010.clone()],
            eval: Some(one_eval),
        },
        BranchEntry {
            moves: vec![move0.clone(), move02.clone()],
            possible_next_moves: vec![move020.clone()],
            eval: Some(one_eval),
        },
        BranchEntry {
            moves: vec![move0.clone(), move00, move000],
            possible_next_moves: vec![],
            eval: Some(mate_eval),
        },
        BranchEntry {
            moves: vec![move0.clone(), move01, move010],
            possible_next_moves: vec![],
            eval: Some(mate_eval),
        },
        BranchEntry {
            moves: vec![move0.clone(), move02, move020],
            possible_next_moves: vec![],
            eval: Some(mate_eval),
        },
    ];
    branches
}

#[wasm_bindgen]
pub fn solve(sfen: &str) -> JsValue {
    if sfen != EXAMPLE_SFEN {
        return JsError::new("Not implemented").into();
    }
    let branches = example_branches();
    serde_wasm_bindgen::to_value(&branches).unwrap()
}

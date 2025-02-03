use mate_solver::search;
use serde::{Deserialize, Serialize};
use shogi_core::{Move, PartialPosition, ToUsi};
use shogi_official_kifu::display_single_move_kansuji;
use shogi_usi_parser::FromUsi;
use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Serialize, Deserialize)]
pub struct Answer {
    branches: Branches,
    elapsed_ms: f64,
}

pub type Branches = Vec<BranchEntry>;

#[derive(Serialize, Deserialize)]
pub struct BranchEntry {
    moves: Vec<JsMove>,
    possible_next_moves: Vec<JsMove>,
    eval: Option<Eval>,
}

impl BranchEntry {
    pub fn from_with_position(
        entry: mate_solver::BranchEntry,
        init_position: &PartialPosition,
    ) -> Self {
        let get_move = |mvs: &[Move]| {
            let mut pos = init_position.clone();
            let (&mvs_last, mvs_init) = mvs.split_last().expect("mvs.len() >= 1 must hold");
            for &mv in mvs_init {
                pos.make_move(mv).expect("Invalid move");
            }
            let official_kifu = display_single_move_kansuji(&pos, mvs_last)
                .expect("Translation to official kifu failed");

            JsMove {
                usi: mvs_last.to_usi_owned(),
                official_kifu,
            }
        };

        let mut cur_pos = init_position.clone();
        for &mv in &entry.moves {
            if let None = cur_pos.make_move(mv) {
                panic!("Invalid move");
            }
        }
        Self {
            moves: entry
                .moves
                .iter()
                .enumerate()
                .map(|(i, _mv)| get_move(&entry.moves[..i + 1]))
                .collect(),
            possible_next_moves: entry
                .possible_next_moves
                .iter()
                .map(|mv| {
                    let usi = mv.to_usi_owned();
                    let official_kifu = display_single_move_kansuji(&cur_pos, *mv).unwrap();
                    JsMove { usi, official_kifu }
                })
                .collect(),
            eval: entry.eval.map(|eval| Eval::from(eval)),
        }
    }
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

impl From<mate_solver::Eval> for Eval {
    fn from(eval: mate_solver::Eval) -> Self {
        Self {
            num_moves: eval.num_moves,
            pieces: eval.pieces,
            futile: eval.futile,
        }
    }
}

#[wasm_bindgen]
pub async fn solve(sfen: &str, timeout_ms: i32) -> JsValue {
    let sfen = "sfen ".to_string() + sfen;
    // https://zenn.dev/dozo/articles/55d793d97157e8
    let position = if let Ok(pos) = PartialPosition::from_usi(&sfen) {
        pos
    } else {
        return JsError::new("Invalid SFEN").into();
    };
    // TODO: https://github.com/tomaka/wasm-timer/issues/12
    // let start = wasm_timer::Instant::now();
    let answer = search(&position, timeout_ms as u64);
    // let elapsed_ms = start.elapsed().as_millis() as f64;
    let elapsed_ms = 0.0;
    match answer.inner {
        Ok(ok) => {
            let branches: Vec<_> = ok
                .branches
                .into_iter()
                .map(|entry| BranchEntry::from_with_position(entry, &position))
                .collect();
            let answer = Answer {
                branches,
                elapsed_ms,
            };
            serde_wasm_bindgen::to_value(&answer).unwrap()
        }
        Err(err) => JsError::new(&format!("error: {:?}", err)).into(),
    }
}

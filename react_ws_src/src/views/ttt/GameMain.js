import React, { Component } from 'react';

import io from 'socket.io-client';
import classNames from 'classnames';
import TweenMax from 'gsap';

import rand_arr_elem from '../../helpers/rand_arr_elem';
import rand_to_fro from '../../helpers/rand_to_fro';

export default class GameMain extends Component {
  constructor(props) {
    super(props);

    this.win_sets = [
      ['c1', 'c2', 'c3'],
      ['c4', 'c5', 'c6'],
      ['c7', 'c8', 'c9'],

      ['c1', 'c4', 'c7'],
      ['c2', 'c5', 'c8'],
      ['c3', 'c6', 'c9'],

      ['c1', 'c5', 'c9'],
      ['c3', 'c5', 'c7'],
    ];

    if (this.props.game_type == 'live') {
      this.sock_start();
    }

    this.state = {
      cell_vals: {},
      next_turn_ply: true,
      game_play: this.props.game_type != 'live' ? true : false,
      game_stat: this.props.game_type != 'live' ? 'Start game' : 'Connecting',
    };

    this.click_cell = this.click_cell.bind(this);
    this.end_game = this.end_game.bind(this);
    this.turn_opp_live = this.turn_opp_live.bind(this);
    this.turn_comp = this.turn_comp.bind(this);
    this.cell_cont = this.cell_cont.bind(this);
  }

  //	------------------------	------------------------	------------------------

  componentDidMount() {
    TweenMax.from('#game_stat', 1, {
      display: 'none',
      opacity: 0,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeIn,
    });
    TweenMax.from('#game_board', 1, {
      display: 'none',
      opacity: 0,
      x: -200,
      y: -200,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeIn,
    });
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  sock_start() {
    this.socket = io(app.settings.ws_conf.loc.SOCKET__io.u);

    this.socket.on(
      'connect',
      function (data) {
        // console.log('socket connected', data)

        this.socket.emit('new player', { name: app.settings.curr_user.name });
      }.bind(this)
    );

    this.socket.on(
      'pair_players',
      function (data) {
        // console.log('paired with ', data)

        this.setState({
          next_turn_ply: data.mode == 'm',
          game_play: true,
          game_stat: 'Playing with ' + data.opp.name,
        });
      }.bind(this)
    );

    this.socket.on('opp_turn', this.turn_opp_live);
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  componentWillUnmount() {
    this.socket && this.socket.disconnect();
  }

  //	------------------------	------------------------	------------------------

  cell_cont(c) {
    const { cell_vals } = this.state;

    return (
      <div>
        {cell_vals && cell_vals[c] == 'x' && (
          <i className="fa fa-times fa-5x"></i>
        )}
        {cell_vals && cell_vals[c] == 'o' && (
          <i className="fa fa-circle-o fa-5x"></i>
        )}
      </div>
    );
  }

  // Render table cell
  render_cell(cNum) {
    let cellClass = classNames({
      vbrd: ['c2', 'c5', 'c8'].includes(cNum),
      hbrd: ['c4', 'c5', 'c6'].includes(cNum),
    });

    return (
      <td
        id={`game_board-${cNum}`}
        ref={cNum}
        onClick={this.click_cell}
        className={cellClass}
        role="button"
      >
        {' '}
        {this.cell_cont(cNum)}{' '}
      </td>
    );
  }

  //	------------------------	------------------------	------------------------

  render() {
    const { cell_vals } = this.state;
    // console.log(cell_vals)

    return (
      <div id="GameMain">
        <h1>Play {this.props.game_type}</h1>

        <div id="game_stat">
          <div id="game_stat_msg">{this.state.game_stat}</div>
          {this.state.game_play && (
            <div id="game_turn_msg">
              {this.state.next_turn_ply ? 'Your turn' : 'Opponent turn'}
            </div>
          )}
        </div>

        <div id="game_board">
          <table>
            <tbody>
              <tr>
                {this.render_cell('c1')}
                {this.render_cell('c2')}
                {this.render_cell('c3')}
              </tr>
              <tr>
                {this.render_cell('c4')}
                {this.render_cell('c5')}
                {this.render_cell('c6')}
              </tr>
              <tr>
                {this.render_cell('c7')}
                {this.render_cell('c8')}
                {this.render_cell('c9')}
              </tr>
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          onClick={this.end_game}
          className="button"
        >
          <span>
            End Game <span className="fa fa-caret-right"></span>
          </span>
        </button>
      </div>
    );
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  click_cell(e) {
    // console.log(e.currentTarget.id.substr(11))
    // console.log(e.currentTarget)

    if (!this.state.next_turn_ply || !this.state.game_play) return;

    const cell_id = e.currentTarget.id.substr(11);
    if (this.state.cell_vals[cell_id]) return;

    if (this.props.game_type != 'live') this.turn_ply_comp(cell_id);
    else this.turn_ply_live(cell_id);
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  turn_ply_comp(cell_id) {
    let { cell_vals } = this.state;

    cell_vals[cell_id] = 'x';

    TweenMax.from(this.refs[cell_id], 0.7, {
      opacity: 0,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeOut,
    });

    // this.setState({
    // 	cell_vals: cell_vals,
    // 	next_turn_ply: false
    // })

    // setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

    this.state.cell_vals = cell_vals;

    this.check_turn();
  }

  //	------------------------	------------------------	------------------------

  turn_comp() {
    let { cell_vals } = this.state;
    let empty_cells_arr = [];

    for (let i = 1; i <= 9; i++)
      !cell_vals['c' + i] && empty_cells_arr.push('c' + i);
    // console.log(cell_vals, empty_cells_arr, rand_arr_elem(empty_cells_arr))

    const c = rand_arr_elem(empty_cells_arr);
    cell_vals[c] = 'o';

    TweenMax.from(this.refs[c], 0.7, {
      opacity: 0,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeOut,
    });

    // this.setState({
    // 	cell_vals: cell_vals,
    // 	next_turn_ply: true
    // })

    this.state.cell_vals = cell_vals;

    this.check_turn();
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  turn_ply_live(cell_id) {
    let { cell_vals } = this.state;

    cell_vals[cell_id] = 'x';

    TweenMax.from(this.refs[cell_id], 0.7, {
      opacity: 0,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeOut,
    });

    this.socket.emit('ply_turn', { cell_id: cell_id });

    // this.setState({
    // 	cell_vals: cell_vals,
    // 	next_turn_ply: false
    // })

    // setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

    this.state.cell_vals = cell_vals;

    this.check_turn();
  }

  //	------------------------	------------------------	------------------------

  turn_opp_live(data) {
    let { cell_vals } = this.state;
    let empty_cells_arr = [];

    const c = data.cell_id;
    cell_vals[c] = 'o';

    TweenMax.from(this.refs[c], 0.7, {
      opacity: 0,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeOut,
    });

    // this.setState({
    // 	cell_vals: cell_vals,
    // 	next_turn_ply: true
    // })

    this.state.cell_vals = cell_vals;

    this.check_turn();
  }

  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------
  //	------------------------	------------------------	------------------------

  check_turn() {
    const { cell_vals } = this.state;

    let win = false;
    let set;
    let fin = true;

    if (this.props.game_type != 'live') this.state.game_stat = 'Play';

    for (let i = 0; !win && i < this.win_sets.length; i++) {
      set = this.win_sets[i];
      if (
        cell_vals[set[0]] &&
        cell_vals[set[0]] == cell_vals[set[1]] &&
        cell_vals[set[0]] == cell_vals[set[2]]
      )
        win = true;
    }

    for (let i = 1; i <= 9; i++) !cell_vals['c' + i] && (fin = false);

    // win && console.log('win set: ', set)

    if (win) {
      this.refs[set[0]].classList.add('win');
      this.refs[set[1]].classList.add('win');
      this.refs[set[2]].classList.add('win');

      TweenMax.killAll(true);
      TweenMax.from('td.win', 1, { opacity: 0, ease: Linear.easeIn });

      this.setState({
        game_stat: (cell_vals[set[0]] == 'x' ? 'You' : 'Opponent') + ' win',
        game_play: false,
      });

      this.socket && this.socket.disconnect();
    } else if (fin) {
      this.setState({
        game_stat: 'Draw',
        game_play: false,
      });

      this.socket && this.socket.disconnect();
    } else {
      this.props.game_type != 'live' &&
        this.state.next_turn_ply &&
        setTimeout(this.turn_comp, rand_to_fro(500, 1000));

      this.setState({
        next_turn_ply: !this.state.next_turn_ply,
      });
    }
  }

  //	------------------------	------------------------	------------------------

  end_game() {
    this.socket && this.socket.disconnect();

    this.props.onEndGame();
  }
}

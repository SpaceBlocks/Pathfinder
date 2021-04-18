import React, {RefObject} from 'react';
import {Point, Tile} from '../../pathfinding/core/Components';
import GridGraph, {Grid} from '../../pathfinding/core/Grid';
import TileFg from './TileFg';

interface IProps {
    tileWidth: number,
    tilesX: number,
    tilesY: number,
    onTilesDragged: () => void,
    topMargin: number
}

interface IState {
    grid: Grid,
    initial: Point,
    goal: Point,
    path: Tile[]
}

const SOLID_COLOR = 'rgb(45, 48, 54)';
const INITIAL_COLOR = 'rgb(131, 217, 52)';
const GOAL_COLOR = 'rgb(203, 75, 14)';
const LINE_COLOR = 'rgb(254,252,119)';

class GridForeground extends React.Component<IProps,IState>
{
    private svg: RefObject<SVGSVGElement> = React.createRef();

    private mouseDown0: boolean = false;
    private mouseDown2: boolean = false;
    private draggingInitial: boolean = false;
    private draggingGoal: boolean = false;
    private disable: boolean = false;

    private doTileAnimation: boolean = true;

    constructor(props: IProps) {
        super(props);
        const end = this.calcEndPointInView();
        this.state = {
            grid: new GridGraph(this.props.tilesX, this.props.tilesY),
            path: [],
            initial: {
                x: ((end.x)/3) >> 0,
                y: ((end.y)/3) >> 0
            },
            goal: {
                x: ((2*(end.x)/3) >> 0) - 1,
                y: ((2*(end.y)/3) >> 0) - 1
            }
        }
    }

    calcEndPointInView() {
        const xEnd = Math.round(window.innerWidth / this.props.tileWidth);
        const yEnd = Math.round((window.innerHeight - this.props.topMargin - 30) / this.props.tileWidth);
        return {
            x: xEnd, y: yEnd
        }
    }

    toggleDisable() {
        this.disable = !this.disable;
    }

    getBoundingRect() {
        return this.svg.current!.getBoundingClientRect();
    }

    private mouseDown = (e: MouseEvent) => {
        e.preventDefault();
        const bounds = this.getBoundingRect();
        this.onPress(e.clientX - bounds.left, e.clientY - bounds.top, e.button);
    }

    private mouseUp = (e: MouseEvent) => {
        e.preventDefault();
        if(e.button === 0) {
            this.draggingGoal = false;
            this.draggingInitial = false;
            this.mouseDown0 = false;
        } else if(e.button === 2) {
            this.mouseDown2 = false;
        }
    }

    private mouseMove = (e: MouseEvent) => {
        const bounds = this.getBoundingRect();
        this.onDrag(e.clientX - bounds.left, e.clientY - bounds.top);
    }

    private touchStart = (e: TouchEvent) => {
        const touch = e.touches[0] || e.changedTouches[0];
        const bounds = this.getBoundingRect();
        this.onTouch(touch.clientX - bounds.left, touch.clientY - bounds.top);
    }

    private touchMove = (e: TouchEvent) => {
        const touch = e.touches[0] || e.changedTouches[0];
        const bounds = this.getBoundingRect();
        this.onDrag(touch.clientX - bounds.left, touch.clientY - bounds.top);
    }

    private onEndingEvent = (e: Event) => {
        e.preventDefault();
        this.draggingGoal = false;
        this.draggingInitial = false;
        this.mouseDown0 = false;
        this.mouseDown2 = false;
    }

    /**
     * Responds to the event thrown at screen coordinates on press
     * @param xCoordinate
     * @param yCoordinate
     * @param button
     */
    private onPress = (xCoordinate: number, yCoordinate: number, button: number) => {
        const point = this.calculatePoint(xCoordinate,yCoordinate);
        if(button === 0) {
            this.mouseDown0 = true;
            if(pointsEqual(point, this.state.initial)) {
                this.draggingInitial = true;
            } else if(pointsEqual(point, this.state.goal)) {
                this.draggingGoal = true;
            } else if(!this.disable) {
                this.drawTile(point);
            }
        } else if(button === 2) {
            this.mouseDown2 = true;
            if(!pointsEqual(point,this.state.initial) && !pointsEqual(point, this.state.goal) && !this.disable) {
                this.eraseTile(point);
            }
        }
    }

    /**
     * Responds to the event thrown at screen coordinates on touch
     * @param xCoordinate
     * @param yCoordinate
     */
    private onTouch = (xCoordinate: number, yCoordinate: number) => {
        const point = this.calculatePoint(xCoordinate,yCoordinate);
        if(pointsEqual(point, this.state.initial)) {
            this.mouseDown0 = true;
            this.draggingInitial = true;
        } else if(pointsEqual(point, this.state.goal)) {
            this.mouseDown0 = true;
            this.draggingGoal = true;
        } else if(!this.state.grid.isSolid(point)) {
            this.mouseDown0 = true;
            if(!this.disable) {
                this.drawTile(point);
            }
        } else {
            this.mouseDown2 = true;
            if(!pointsEqual(point, this.state.initial) && !pointsEqual(point, this.state.goal) && !this.disable) {
                this.eraseTile(point);
            }
        }
    }

    /**
     * Responds to the event thrown at screen coordinates on drag/move
     * @param xCoordinate
     * @param yCoordinate
     */
    private onDrag = (xCoordinate: number, yCoordinate: number) => {
        const point = this.calculatePoint(xCoordinate,yCoordinate);
        if(this.mouseDown0) {
            if(this.draggingInitial) {
                this.moveInitial(point);
            } else if(this.draggingGoal) {
                this.moveGoal(point);
            } else if(!pointsEqual(point,this.state.initial) && !pointsEqual(point, this.state.goal) && !this.disable) {
                this.drawTile(point);
            }
        } else if(this.mouseDown2) {
            if(!pointsEqual(point, this.state.initial) && !pointsEqual(point, this.state.goal) && !this.disable) {
                this.eraseTile(point);
            }
        }
    }

    /**
     * Draw an entire new grid on the foreground with disabled animations
     * @param grid
     */
    drawGrid = (grid: Grid) => {
        this.doTileAnimation = false;
        this.setState({
            grid: grid
        }, () => this.doTileAnimation = true)
    }

    /**
     * Draw tile at point
     * @param point
     */
    drawTile = (point: Point) => {
        const grid = this.state.grid;
        if(grid.inBounds(point)) {
            grid.mutateDefault(point, true);
        }
        this.forceUpdate();
    }

    /**
     * Checks if a node is visualized, then changes the tile to empty if it isn't
     * @param point
     */
    eraseTile = (point: Point) => {
        const grid = this.state.grid;
        if(grid.inBounds(point)) {
            grid.mutateDefault(point, false);
        }
        this.forceUpdate();
    }

    /**
     * Clear grid in state
     */
    clearTiles = () => {
        const grid = this.state.grid;
        for(let y = 0; y < this.props.tilesY; y++) {
            for(let x = 0; x < this.props.tilesX; x++) {
                const point = {
                    x: x, y: y
                }
                grid.mutateDefault(point, false);
            }
        }
        this.forceUpdate();
    }

    /**
     * Moves initial to a new point
     * @param point
     */
    moveInitial = (point: Point) => {
        if(this.state.grid.inBounds(point)
            && !this.state.grid.isSolid(point)
            && !pointsEqual(this.state.goal, point)
            && !pointsEqual(this.state.initial, point)
            && !this.disable)
        {
            this.setState({
                initial: point
            }, () => this.props.onTilesDragged());
        }
    }

    /**
     * Moves goal to a new point
     * @param point
     */
    moveGoal = (point: Point) => {
        if(this.state.grid.inBounds(point)
            && !this.state.grid.isSolid(point)
            && !pointsEqual(this.state.initial, point)
            && !pointsEqual(this.state.goal, point)
            && !this.disable)
        {
            this.setState({
                goal: point
            }, () => this.props.onTilesDragged());
        }
    }

    drawPath = (path: Tile[]) => {
        this.setState({
            path: path.slice()
        });
    }

    erasePath = () => {
        this.setState({
            path: []
        });
    }

    /**
     * Converts real screen x,y coordinates into
     * a 2d point position on the grid
     * @param xCoordinate
     * @param yCoordinate
     */
    calculatePoint = (xCoordinate: number, yCoordinate: number) => {
        return {
            x: Math.floor(xCoordinate/this.props.tileWidth),
            y: Math.floor(yCoordinate/this.props.tileWidth)
        }
    }

    render() {
        return (
            <svg ref={this.svg} xmlns='http://www.w3.org/2000/svg' className='grid'
                 onContextMenu={e => e.preventDefault()}
                 onMouseDown={e => this.mouseDown(e.nativeEvent)}
                 onMouseUp={e => this.mouseUp(e.nativeEvent)}
                 onMouseMove={e => this.mouseMove(e.nativeEvent)}
                 onMouseLeave={e => this.onEndingEvent(e.nativeEvent)}
                 onTouchStart={e => this.touchStart(e.nativeEvent)}
                 onTouchMoveCapture={e => this.touchMove(e.nativeEvent)}
                 onTouchEnd={e => this.onEndingEvent(e.nativeEvent)}
                 onTouchCancel={e => this.onEndingEvent(e.nativeEvent)}
            >
                {this.renderEndTile(this.state.initial, INITIAL_COLOR,'initial')}
                {this.renderEndTile(this.state.goal, GOAL_COLOR,'goal')}
                {this.renderLines()}
                {this.renderTiles()}
            </svg>
        );
    }

    private renderLines = () => {
        const lines: JSX.Element[] = [];
        for(let i = 0; i < this.state.path.length-1; i++) {
            const first = this.state.path[i].point;
            const second = this.state.path[i+1].point;
            lines.push(this.renderLine(first, second));
        }
        return lines;
    }

    private renderLine = (first: Point, second: Point) => {
        const width = this.props.tileWidth;
        const offset = width/2;
        return (
            <line key={second.x + ',' + second.y}
                  x1={first.x * width + offset} y1={first.y * width + offset}
                  x2={second.x * width + offset} y2={second.y * width + offset}
                  stroke={LINE_COLOR} strokeWidth='2' className='line'/>
        );
    }

    private renderTiles = () => {
        const tiles: JSX.Element[] = [];
        for(let y = 0; y < this.props.tilesY; y++) {
            for(let x = 0; x < this.props.tilesX; x++) {
                const point = {
                    x: x, y: y
                }
                if(this.state.grid.isSolid(point)) {
                    tiles.push(
                        <TileFg key={point.x + ',' + point.y} point={point}
                                doAnimation={this.doTileAnimation}
                                tileWidth={this.props.tileWidth}
                                color={SOLID_COLOR}
                        />
                    );
                }
            }
        }
        return tiles;
    }

    private renderEndTile = (point: Point, color: string, key: string) => {
        return <TileFg key={key} point={point} doAnimation={false}
                       tileWidth={this.props.tileWidth}
                       color={color}/>
    }
}

function pointsEqual(point1: Point, point2: Point) {
    return point1.x === point2.x && point1.y === point2.y;
}

export default GridForeground;
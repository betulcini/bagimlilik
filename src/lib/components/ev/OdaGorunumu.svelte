<script>
	import { createEventDispatcher } from 'svelte';
	import EsyaIkon from './EsyaIkon.svelte';

	export let yerleşmişler = [];
	export let readonly = false;
	export let gridSize = 6;

	const dispatch = createEventDispatcher();

	const TILE_W = 74;
	const TILE_H = 37;
	const WALL_H = 92;

	function köşe(c, r) {
		return { x: (c - r) * (TILE_W / 2), y: (c + r) * (TILE_H / 2) };
	}

	function tileMerkezi(col, row) {
		const a = köşe(col, row);
		const c = köşe(col + 1, row + 1);
		return { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 };
	}

	function tilePoligon(col, row) {
		const a = köşe(col, row);
		const b = köşe(col + 1, row);
		const c = köşe(col + 1, row + 1);
		const d = köşe(col, row + 1);
		return [a, b, c, d].map((p) => `${p.x},${p.y}`).join(' ');
	}

	function hücredeEşyaVarMı(col, row) {
		return yerleşmişler.find((uh) => uh.konum_x === col && uh.konum_y === row);
	}

	$: solDuvar = (() => {
		const a = köşe(0, 0);
		const b = köşe(0, gridSize);
		return [`${a.x},${a.y}`, `${b.x},${b.y}`, `${b.x},${b.y - WALL_H}`, `${a.x},${a.y - WALL_H}`].join(' ');
	})();

	$: arkaDuvar = (() => {
		const a = köşe(0, 0);
		const b = köşe(gridSize, 0);
		return [`${a.x},${a.y}`, `${b.x},${b.y}`, `${b.x},${b.y - WALL_H}`, `${a.x},${a.y - WALL_H}`].join(' ');
	})();

	$: viewBox = `${-gridSize * (TILE_W / 2) - 20} ${-WALL_H - 20} ${gridSize * TILE_W + 40} ${gridSize * TILE_H + WALL_H + 60}`;
</script>

<svg {viewBox} class="room-svg">
	<polygon points={solDuvar} class="wall wall-left" />
	<polygon points={arkaDuvar} class="wall wall-back" />

	{#each Array(gridSize) as _r, row}
		{#each Array(gridSize) as _c, col}
			<polygon
				points={tilePoligon(col, row)}
				class="tile"
				class:tile-alt={(row + col) % 2 === 0}
				class:readonly
				on:click={() => !readonly && dispatch('tileClick', { col, row })}
			/>
		{/each}
	{/each}

	{#each yerleşmişler as uh (uh.id)}
		{@const merkez = tileMerkezi(uh.konum_x, uh.konum_y)}
		<g
			class="placed-item"
			class:nadir={uh.house_items?.nadir_mi}
			class:readonly
			transform="translate({merkez.x},{merkez.y - 8})"
			on:click={() => !readonly && dispatch('itemClick', uh)}
		>
			<circle r="17" class="item-badge-bg" />
			<svg x="-11" y="-11" width="22" height="22" viewBox="0 0 24 24">
				<EsyaIkon ref={uh.house_items?.görsel_referans} />
			</svg>
		</g>
	{/each}
</svg>

<style>
	.room-svg {
		width: 100%;
		max-width: 480px;
		overflow: visible;
	}
	.wall {
		fill: var(--accent-soft);
		stroke: var(--border);
		stroke-width: 1;
	}
	.wall-left {
		filter: brightness(0.94);
	}
	.tile {
		fill: var(--bg);
		stroke: var(--border);
		stroke-width: 1;
		cursor: pointer;
		transition: fill 0.12s ease;
	}
	.tile-alt {
		fill: var(--accent-soft);
	}
	.tile:not(.readonly):hover {
		fill: var(--gold);
		opacity: 0.55;
	}
	.tile.readonly {
		cursor: default;
	}
	.placed-item {
		cursor: pointer;
	}
	.placed-item.readonly {
		cursor: default;
	}
	.item-badge-bg {
		fill: var(--bg-elevated);
		stroke: var(--border);
		stroke-width: 1.5;
	}
	.placed-item.nadir .item-badge-bg {
		stroke: var(--gold);
		stroke-width: 2;
	}
</style>

<?php

declare(strict_types=1);

namespace FichApp\Tests\Unit;

use PHPUnit\Framework\TestCase;
use FichApp\Support\Container;
use stdClass;

final class ContainerTest extends TestCase
{
    public function testCanBindAndResolveServices(): void
    {
        $container = new Container();
        $container->bind('service.dummy', fn() => (object)['foo' => 'bar']);

        $resolved = $container->get('service.dummy');
        $this->assertInstanceOf(stdClass::class, $resolved);
        $this->assertSame('bar', $resolved->foo);
    }

    public function testSingletonReturnsSameInstance(): void
    {
        $container = new Container();
        $obj = new stdClass();
        $container->singleton('singleton.dummy', $obj);

        $first = $container->get('singleton.dummy');
        $second = $container->get('singleton.dummy');

        $this->assertSame($first, $second);
    }
}
